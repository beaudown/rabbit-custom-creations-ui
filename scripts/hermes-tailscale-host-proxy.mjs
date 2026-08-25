import { createServer, request as httpRequest } from "node:http";
import { readFileSync } from "node:fs";
import { connect as netConnect } from "node:net";
import { timingSafeEqual } from "node:crypto";

const listenHost = process.env.HERMES_TAILSCALE_PROXY_HOST || "127.0.0.1";
const listenPort = Number.parseInt(process.env.HERMES_TAILSCALE_PROXY_PORT || "9121", 10);
const upstreamUrl = new URL(process.env.HERMES_TAILSCALE_PROXY_UPSTREAM || "http://127.0.0.1:9120");
const imessageBrokerUrl = new URL(process.env.HERMES_IMESSAGE_BROKER_URL || "http://127.0.0.1:8796");
const imessageBrokerTokenFile =
  process.env.HERMES_IMESSAGE_BROKER_TOKEN_FILE || "/private/tmp/imessage-hermes-broker-token.txt";
const maxImessageBodyBytes = Number.parseInt(process.env.HERMES_IMESSAGE_PROXY_MAX_BODY_BYTES || "2097152", 10);
const maxImessageResponseBytes = Number.parseInt(process.env.HERMES_IMESSAGE_PROXY_MAX_RESPONSE_BYTES || "5242880", 10);
const publicFunnelPort = process.env.HERMES_IMESSAGE_PUBLIC_FUNNEL_PORT || "10001";
const publicFunnelHost = process.env.HERMES_IMESSAGE_PUBLIC_FUNNEL_HOST || "michaels-macbook-pro.tailcfaeac.ts.net";
const publicFunnelAllowSend = process.env.HERMES_IMESSAGE_PUBLIC_ALLOW_SEND !== "false";
const creationGateId = process.env.HERMES_IMESSAGE_CREATION_GATE_ID || "b0ba279701768529048562f2c766e9d4";
const creationGateKey =
  process.env.HERMES_IMESSAGE_CREATION_GATE_KEY ||
  "29043089b8e62fd942f21d68762411e503bfcaba6d491844162e90516a7e783b";
const upstreamHostHeader =
  process.env.HERMES_TAILSCALE_PROXY_HOST_HEADER || `${upstreamUrl.hostname}:${upstreamUrl.port || "80"}`;

const imessageRoutes = new Map([
  ["GET /imessage/health", "imessage.read"],
  ["GET /imessage/messages", "imessage.read"],
  ["GET /imessage/threads", "imessage.read"],
  ["POST /imessage/send", "imessage.send"],
  ["POST /imessage/hermes-response", "imessage.send"],
]);

const strippedPublicImessagePaths = new Map([
  ["/health", "/imessage/health"],
  ["/messages", "/imessage/messages"],
  ["/threads", "/imessage/threads"],
  ["/send", "/imessage/send"],
  ["/hermes-response", "/imessage/hermes-response"],
]);

function rewriteHeaders(headers) {
  return {
    ...headers,
    host: upstreamHostHeader,
    "x-forwarded-host": headers.host || "",
    "x-forwarded-proto": "https",
  };
}

function writeJson(clientRes, statusCode, payload) {
  clientRes.writeHead(statusCode, {
    "cache-control": "no-store",
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type, x-hermes-verify, x-rabbit-creation-id, x-rabbit-creation-gate",
  });
  clientRes.end(JSON.stringify(payload));
}

function safeEquals(actual, expected) {
  const actualBuffer = Buffer.from(String(actual || ""), "utf8");
  const expectedBuffer = Buffer.from(String(expected || ""), "utf8");
  if (actualBuffer.length !== expectedBuffer.length) {
    return false;
  }
  return timingSafeEqual(actualBuffer, expectedBuffer);
}

function readBrokerToken() {
  const envToken = process.env.HERMES_IMESSAGE_BROKER_TOKEN?.trim();
  if (envToken) {
    return envToken;
  }
  try {
    return readFileSync(imessageBrokerTokenFile, "utf8").trim();
  } catch {
    return "";
  }
}

function collectBody(clientReq) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    clientReq.on("data", chunk => {
      size += chunk.length;
      if (size > maxImessageBodyBytes) {
        reject(new Error("request_body_too_large"));
        clientReq.destroy();
        return;
      }
      chunks.push(chunk);
    });
    clientReq.on("end", () => resolve(Buffer.concat(chunks)));
    clientReq.on("error", reject);
  });
}

function collectResponse(upstreamRes) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    upstreamRes.on("data", chunk => {
      size += chunk.length;
      if (size > maxImessageResponseBytes) {
        reject(new Error("response_body_too_large"));
        upstreamRes.destroy();
        return;
      }
      chunks.push(chunk);
    });
    upstreamRes.on("end", () => resolve(Buffer.concat(chunks)));
    upstreamRes.on("error", reject);
  });
}

function isPublicFunnelRequest(clientReq) {
  const host = String(clientReq.headers.host || "").toLowerCase();
  return host === publicFunnelHost || host.endsWith(`:${publicFunnelPort}`);
}

function normalizeImessagePath(pathname, publicFunnel) {
  if (pathname.startsWith("/imessage/")) {
    return pathname;
  }
  if (publicFunnel && strippedPublicImessagePaths.has(pathname)) {
    return strippedPublicImessagePaths.get(pathname);
  }
  return pathname;
}

function queryValue(requestUrl, ...names) {
  for (const name of names) {
    const value = requestUrl.searchParams.get(name);
    if (value) {
      return value;
    }
  }
  return "";
}

function sanitizedBrokerPath(path, rawUrl) {
  const sourceUrl = new URL(rawUrl || "/", "https://hermes.tailnet.local");
  for (const name of ["hv", "hermesVerify", "cid", "creationId", "cg", "creationGate"]) {
    sourceUrl.searchParams.delete(name);
  }
  const query = sourceUrl.searchParams.toString();
  return query ? `${path}?${query}` : path;
}

function hasRealSendBody(body) {
  try {
    const payload = JSON.parse(body.toString("utf8") || "{}");
    return Boolean(
      String(payload.recipient || payload.to || payload.handle || "").trim() ||
        String(payload.message || payload.text || payload.body || payload.reply || "").trim(),
    );
  } catch {
    return body.length > 0;
  }
}

function redactThreadPayload(buffer) {
  try {
    const payload = JSON.parse(buffer.toString("utf8"));
    if (!Array.isArray(payload.threads)) {
      return buffer;
    }
    payload.publicFunnelRedacted = true;
    payload.threads = payload.threads.map(thread => ({
      chatIdentifier: thread.chatIdentifier,
      displayName: thread.displayName,
      receivedCount: Array.isArray(thread.received) ? thread.received.length : 0,
      sentCount: Array.isArray(thread.sent) ? thread.sent.length : 0,
      latestAt: thread.latestAt || thread.lastMessageAt || null,
    }));
    return Buffer.from(JSON.stringify(payload, null, 2));
  } catch {
    return Buffer.from(
      JSON.stringify({
        ok: false,
        role: "hermes-tailscale-host-proxy",
        error: "thread_redaction_failed",
      }),
    );
  }
}

function forwardImessageRequest(clientReq, clientRes, path, body, options = {}) {
  const brokerPath = sanitizedBrokerPath(path, clientReq.url);
  const token = readBrokerToken();
  if (!token) {
    writeJson(clientRes, 503, {
      ok: false,
      role: "hermes-tailscale-host-proxy",
      error: "broker_token_unavailable",
    });
    return;
  }

  const proxyReq = httpRequest(
    {
      hostname: imessageBrokerUrl.hostname,
      port: imessageBrokerUrl.port || 80,
      method: clientReq.method,
      path: brokerPath,
      headers: {
        accept: "application/json",
        "content-type": clientReq.headers["content-type"] || "application/json",
        "content-length": body.length,
        "x-imessage-broker-token": token,
      },
    },
    async proxyRes => {
      if (options.redactThreads) {
        try {
          const responseBody = redactThreadPayload(await collectResponse(proxyRes));
          clientRes.writeHead(proxyRes.statusCode || 502, {
            "cache-control": "no-store",
            "content-type": "application/json",
            "x-hermes-imessage-proxy": "verified-redacted",
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET, POST, OPTIONS",
            "access-control-allow-headers":
              "content-type, x-hermes-verify, x-rabbit-creation-id, x-rabbit-creation-gate",
          });
          clientRes.end(responseBody);
        } catch {
          writeJson(clientRes, 502, {
            ok: false,
            role: "hermes-tailscale-host-proxy",
            error: "imessage_broker_response_unreadable",
          });
        }
        return;
      }
      clientRes.writeHead(proxyRes.statusCode || 502, {
        ...proxyRes.headers,
        "cache-control": "no-store",
        "x-hermes-imessage-proxy": "verified",
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, POST, OPTIONS",
        "access-control-allow-headers": "content-type, x-hermes-verify, x-rabbit-creation-id, x-rabbit-creation-gate",
      });
      proxyRes.pipe(clientRes);
    },
  );

  proxyReq.on("error", () => {
    writeJson(clientRes, 502, {
      ok: false,
      role: "hermes-tailscale-host-proxy",
      error: "imessage_broker_unreachable",
    });
  });

  proxyReq.end(body);
}

async function maybeHandleImessageProxy(clientReq, clientRes) {
  const requestUrl = new URL(clientReq.url || "/", "https://hermes.tailnet.local");
  const publicFunnel = isPublicFunnelRequest(clientReq);
  const imessagePath = normalizeImessagePath(requestUrl.pathname, publicFunnel);
  const routeKey = `${clientReq.method} ${imessagePath}`;

  if (clientReq.method === "OPTIONS" && (requestUrl.pathname.startsWith("/imessage/") || imessagePath.startsWith("/imessage/"))) {
    clientRes.writeHead(204, {
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "content-type, x-hermes-verify, x-rabbit-creation-id, x-rabbit-creation-gate",
    });
    clientRes.end();
    return true;
  }

  const requiredVerify = imessageRoutes.get(routeKey);
  if (!requiredVerify) {
    if (!requestUrl.pathname.startsWith("/imessage/") && !imessagePath.startsWith("/imessage/")) {
      return false;
    }
    writeJson(clientRes, 404, {
      ok: false,
      role: "hermes-tailscale-host-proxy",
      error: "imessage_route_not_allowed",
    });
    return true;
  }

  const providedVerify = clientReq.headers["x-hermes-verify"] || queryValue(requestUrl, "hv", "hermesVerify");
  if (providedVerify !== requiredVerify) {
    writeJson(clientRes, 403, {
      ok: false,
      role: "hermes-tailscale-host-proxy",
      error: "hermes_verify_failed",
      required: requiredVerify,
    });
    return true;
  }

  if (
    publicFunnel &&
    (!safeEquals(clientReq.headers["x-rabbit-creation-id"] || queryValue(requestUrl, "cid", "creationId"), creationGateId) ||
      !safeEquals(clientReq.headers["x-rabbit-creation-gate"] || queryValue(requestUrl, "cg", "creationGate"), creationGateKey))
  ) {
    writeJson(clientRes, 403, {
      ok: false,
      role: "hermes-tailscale-host-proxy",
      error: "creation_gate_failed",
      required: "x-rabbit-creation-id and x-rabbit-creation-gate",
    });
    return true;
  }

  try {
    const body = clientReq.method === "POST" ? await collectBody(clientReq) : Buffer.alloc(0);
    if (
      publicFunnel &&
      (imessagePath === "/imessage/send" || imessagePath === "/imessage/hermes-response") &&
      hasRealSendBody(body) &&
      !publicFunnelAllowSend
    ) {
      writeJson(clientRes, 403, {
        ok: false,
        role: "hermes-tailscale-host-proxy",
        error: "public_funnel_real_send_blocked",
      });
      return true;
    }
    forwardImessageRequest(clientReq, clientRes, imessagePath, body);
  } catch (error) {
    writeJson(clientRes, error.message === "request_body_too_large" ? 413 : 400, {
      ok: false,
      role: "hermes-tailscale-host-proxy",
      error: error.message === "request_body_too_large" ? "request_body_too_large" : "request_body_unreadable",
    });
  }
  return true;
}

const server = createServer(async (clientReq, clientRes) => {
  if (await maybeHandleImessageProxy(clientReq, clientRes)) {
    return;
  }

  const upstreamReq = httpRequest(
    {
      hostname: upstreamUrl.hostname,
      port: upstreamUrl.port || 80,
      method: clientReq.method,
      path: clientReq.url,
      headers: rewriteHeaders(clientReq.headers),
    },
    upstreamRes => {
      clientRes.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
      upstreamRes.pipe(clientRes);
    },
  );

  upstreamReq.on("error", error => {
    clientRes.writeHead(502, {
      "cache-control": "no-store",
      "content-type": "application/json",
    });
    clientRes.end(
      JSON.stringify({
        ok: false,
        role: "hermes-tailscale-host-proxy",
        error: "upstream_unreachable",
        message: error.message,
      }),
    );
  });

  clientReq.pipe(upstreamReq);
});

server.on("upgrade", (clientReq, clientSocket, head) => {
  const upstreamSocket = netConnect(Number.parseInt(upstreamUrl.port || "80", 10), upstreamUrl.hostname, () => {
    upstreamSocket.write(
      `${clientReq.method} ${clientReq.url} HTTP/${clientReq.httpVersion}\r\n` +
        Object.entries(rewriteHeaders(clientReq.headers))
          .map(([name, value]) => {
            const joined = Array.isArray(value) ? value.join(", ") : String(value ?? "");
            return `${name}: ${joined}`;
          })
          .join("\r\n") +
        "\r\n\r\n",
    );
    if (head?.length) {
      upstreamSocket.write(head);
    }
    upstreamSocket.pipe(clientSocket);
    clientSocket.pipe(upstreamSocket);
  });

  upstreamSocket.on("error", () => clientSocket.destroy());
  clientSocket.on("error", () => upstreamSocket.destroy());
});

server.listen(listenPort, listenHost, () => {
  console.log(
    `Hermes Tailscale host proxy listening on http://${listenHost}:${listenPort} -> ${upstreamUrl.origin} with Host ${upstreamHostHeader}`,
  );
});
