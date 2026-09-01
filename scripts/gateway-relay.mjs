import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";

const port = Number.parseInt(process.env.RABBIT_RELAY_PORT || "8794", 10);
const host = process.env.RABBIT_RELAY_HOST || "127.0.0.1";
const upstream = (process.env.RABBIT_RELAY_UPSTREAM || "http://127.0.0.1:8792").replace(/\/$/, "");
const relayToken = process.env.RABBIT_RELAY_TOKEN || "";
const relayTokenFile = process.env.RABBIT_RELAY_TOKEN_FILE || "";
const relayLocalTestKeyFile = process.env.RABBIT_RELAY_LOCAL_TEST_KEY_FILE || "";
const relayPublicUrl = process.env.RABBIT_RELAY_PUBLIC_URL || "";
const relayId = process.env.RABBIT_RELAY_ID || `rabbit-gateway-relay-${randomUUID().slice(0, 8)}`;

const allowedRoutes = new Map([
  ["GET /health", { upstreamPath: "/health" }],
  ["GET /bridge/route", { upstreamPath: "/bridge/route" }],
  ["GET /adb/status", { upstreamPath: "/adb/status" }],
  ["GET /broker/service", { upstreamPath: "/broker/service" }],
  ["POST /broker/service", { upstreamPath: "/broker/service" }],
  ["GET /actions/catalog", { upstreamPath: "/actions/catalog" }],
  ["POST /actions", { upstreamPath: "/actions" }],
  ["POST /requests", { upstreamPath: "/requests" }],
  ["POST /skills/upload", { upstreamPath: "/skills/upload" }],
  ["GET /rabbit-broker/health", { upstreamPath: "/health" }],
  ["GET /rabbit-broker/actions/catalog", { upstreamPath: "/actions/catalog" }],
  ["POST /rabbit-broker/actions", { upstreamPath: "/actions" }],
]);

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "access-control-allow-headers": "content-type, x-rabbit-relay-token, x-rabbit-relay-token-key, x-rabbit-relay-key",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-origin": "*",
    "cache-control": "no-store",
    "content-type": "application/json",
  });
  response.end(JSON.stringify(body, null, 2));
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function hasAuth(request, url) {
  const activeToken = getRelayToken();
  const presentedToken = request.headers["x-rabbit-relay-token"] || url.searchParams.get("relay_token");
  if (activeToken && presentedToken === activeToken) {
    return true;
  }

  const presentedKey =
    request.headers["x-rabbit-relay-token-key"] ||
    request.headers["x-rabbit-relay-key"] ||
    url.searchParams.get("relay_token_key") ||
    url.searchParams.get("relay_key");
  return hasLocalTestKey(presentedKey);
}

function getRelayToken() {
  if (relayTokenFile) {
    try {
      return readFileSync(relayTokenFile, "utf8").trim();
    } catch {
      return "";
    }
  }
  return relayToken;
}

function getLocalTestValidator() {
  if (!relayLocalTestKeyFile) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(relayLocalTestKeyFile, "utf8"));
  } catch {
    return null;
  }
}

function hasLocalTestKey(presentedKey) {
  const key = typeof presentedKey === "string" ? presentedKey.trim() : "";
  if (!key) {
    return false;
  }
  const validator = getLocalTestValidator();
  if (!validator?.enabled || validator?.scope !== "a1_local_test_only") {
    return false;
  }
  const activeKeys = Array.isArray(validator.activeKeys) ? validator.activeKeys : [];
  return activeKeys.some((entry) => {
    if (!entry || entry.key !== key || entry.revoked) {
      return false;
    }
    if (entry.expiresAt && Date.parse(entry.expiresAt) <= Date.now()) {
      return false;
    }
    return true;
  });
}

function publicStatus() {
  const usesHttps = relayPublicUrl.startsWith("https://");
  const activeToken = getRelayToken();
  return {
    schemaVersion: 1,
    relayId,
    status: activeToken && usesHttps ? "relay_configured_for_https_test" : "relay_local_only",
    role: "authenticated_gateway_relay",
    upstream,
    publicUrl: relayPublicUrl || "not_configured",
    requiresAuth: true,
    acceptsLocalTestKey: Boolean(getLocalTestValidator()?.enabled),
    publicUrlUsesHttps: usesHttps,
    allowedRoutes: [...allowedRoutes.keys()],
    exposesGatewaySecrets: false,
    privilegedExecutionEnabled: false,
    releaseReady: false,
    releaseBlockers: [
      activeToken ? null : "RABBIT_RELAY_TOKEN or RABBIT_RELAY_TOKEN_FILE is not set.",
      usesHttps ? null : "RABBIT_RELAY_PUBLIC_URL is not configured as HTTPS.",
      "External Rabbit reachability has not been verified.",
      "Rabbit-native privileged executor is not installed or validated.",
    ].filter(Boolean),
  };
}

async function proxyRequest(request, response, url, route) {
  if (!hasAuth(request, url)) {
    sendJson(response, 401, {
      schemaVersion: 1,
      relayId,
      status: "blocked",
      error: "relay_auth_required",
      message: "Gateway relay requires a relay token. No privileged execution occurred.",
      privilegedExecutionPerformed: false,
    });
    return;
  }

  const body = request.method === "POST" ? await readBody(request) : undefined;
  const upstreamResponse = await fetch(`${upstream}${route.upstreamPath}`, {
    method: request.method,
    headers: request.method === "POST" ? { "content-type": "application/json" } : undefined,
    body,
  });
  const text = await upstreamResponse.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { raw: text };
  }

  sendJson(response, upstreamResponse.status, {
    schemaVersion: 1,
    relayId,
    status: upstreamResponse.ok ? "forwarded" : "upstream_returned_error",
    upstreamPath: route.upstreamPath,
    upstreamStatus: upstreamResponse.status,
    response: parsed,
    relay: {
      exposesGatewaySecrets: false,
      privilegedExecutionPerformed: false,
      persistentChange: false,
      otaBreakingChange: false,
    },
  });
}

async function handleRequest(request, response) {
  const url = new URL(request.url || "/", `http://${request.headers.host}`);

  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (request.method === "GET" && url.pathname === "/relay/health") {
    sendJson(response, 200, publicStatus());
    return;
  }

  if (url.pathname === "/gateway/relay/probe") {
    const route = allowedRoutes.get(`${request.method} /health`);
    const authOk = hasAuth(request, url);
    const status = publicStatus();
    sendJson(response, authOk && relayPublicUrl.startsWith("https://") ? 200 : 409, {
      ...status,
      probe: {
        authOk,
        brokerCompatibilityPath: "/health",
        routeAvailable: Boolean(route),
        nextStep:
          authOk && relayPublicUrl.startsWith("https://")
            ? "Run external Rabbit reachability test against this HTTPS relay URL."
            : "Set an HTTPS public relay URL and provide relay auth before Rabbit testing.",
      },
    });
    return;
  }

  const canonicalPath = url.pathname.replace(/\/$/, "") || "/";
  const route = allowedRoutes.get(`${request.method} ${canonicalPath}`);
  if (!route) {
    sendJson(response, 404, {
      schemaVersion: 1,
      relayId,
      status: "blocked",
      error: "route_not_allowlisted",
      allowedRoutes: [...allowedRoutes.keys()],
      privilegedExecutionPerformed: false,
    });
    return;
  }

  await proxyRequest(request, response, url, route);
}

if (!getRelayToken()) {
  console.warn("RABBIT_RELAY_TOKEN or RABBIT_RELAY_TOKEN_FILE is not set. Relay will answer /relay/health but block broker forwarding.");
}

const server = createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    sendJson(response, 502, {
      schemaVersion: 1,
      relayId,
      status: "upstream_unreachable",
      error: "relay_error",
      message: error.message,
      privilegedExecutionPerformed: false,
    });
  });
});

server.listen(port, host, () => {
  console.log(`Rabbit gateway relay listening on http://${host}:${port}`);
  console.log("Forwarding is allowlisted and requires RABBIT_RELAY_TOKEN.");
});
