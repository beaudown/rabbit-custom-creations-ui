import { createServer, request as httpRequest } from "node:http";
import { connect as netConnect } from "node:net";

const listenHost = process.env.HERMES_TAILSCALE_PROXY_HOST || "127.0.0.1";
const listenPort = Number.parseInt(process.env.HERMES_TAILSCALE_PROXY_PORT || "9121", 10);
const upstreamUrl = new URL(process.env.HERMES_TAILSCALE_PROXY_UPSTREAM || "http://127.0.0.1:9120");
const upstreamHostHeader =
  process.env.HERMES_TAILSCALE_PROXY_HOST_HEADER || `${upstreamUrl.hostname}:${upstreamUrl.port || "80"}`;

function rewriteHeaders(headers) {
  return {
    ...headers,
    host: upstreamHostHeader,
    "x-forwarded-host": headers.host || "",
    "x-forwarded-proto": "https",
  };
}

const server = createServer((clientReq, clientRes) => {
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
