import assert from "node:assert/strict";
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import test from "node:test";

function listen(server, port) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve());
  });
}

async function waitForRelay(url) {
  const started = Date.now();
  let lastError;
  while (Date.now() - started < 5000) {
    try {
      const response = await fetch(`${url}/relay/health`);
      if (response.ok) {
        return response.json();
      }
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw lastError || new Error("relay health check timed out");
}

test("gateway relay requires auth and forwards only allowlisted broker routes", async () => {
  const repoRoot = fileURLToPath(new URL("..", import.meta.url));
  const upstreamPort = 19100 + Math.floor(Math.random() * 1000);
  const relayPort = 20100 + Math.floor(Math.random() * 1000);
  const token = "test-relay-token";

  const upstream = createServer(async (request, response) => {
    const chunks = [];
    for await (const chunk of request) chunks.push(chunk);
    const body = Buffer.concat(chunks).toString("utf8");
    response.writeHead(200, { "content-type": "application/json" });
    response.end(
      JSON.stringify({
        ok: true,
        method: request.method,
        path: request.url,
        body: body ? JSON.parse(body) : null,
        privilegedExecutionPerformed: false,
      }),
    );
  });

  await listen(upstream, upstreamPort);

  const child = spawn(process.execPath, [`${repoRoot}/scripts/gateway-relay.mjs`], {
    cwd: repoRoot,
    env: {
      ...process.env,
      RABBIT_RELAY_HOST: "127.0.0.1",
      RABBIT_RELAY_PORT: String(relayPort),
      RABBIT_RELAY_TOKEN: token,
      RABBIT_RELAY_UPSTREAM: `http://127.0.0.1:${upstreamPort}`,
    },
    stdio: "ignore",
  });

  const baseUrl = `http://127.0.0.1:${relayPort}`;

  try {
    const health = await waitForRelay(baseUrl);
    assert.equal(health.role, "authenticated_gateway_relay");
    assert.equal(health.requiresAuth, true);
    assert.equal(health.privilegedExecutionEnabled, false);
    assert.equal(health.releaseReady, false);

    const unauthenticated = await fetch(`${baseUrl}/health`);
    assert.equal(unauthenticated.status, 401);
    const unauthenticatedBody = await unauthenticated.json();
    assert.equal(unauthenticatedBody.error, "relay_auth_required");
    assert.equal(unauthenticatedBody.privilegedExecutionPerformed, false);

    const forwardedHealth = await fetch(`${baseUrl}/health`, {
      headers: { "x-rabbit-relay-token": token },
    });
    assert.equal(forwardedHealth.status, 200);
    const forwardedHealthBody = await forwardedHealth.json();
    assert.equal(forwardedHealthBody.status, "forwarded");
    assert.equal(forwardedHealthBody.upstreamPath, "/health");
    assert.equal(forwardedHealthBody.response.path, "/health");
    assert.equal(forwardedHealthBody.relay.privilegedExecutionPerformed, false);

    const actionResponse = await fetch(`${baseUrl}/rabbit-broker/actions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-rabbit-relay-token": token,
      },
      body: JSON.stringify({ action: "temporary_superuser", execute: false }),
    });
    assert.equal(actionResponse.status, 200);
    const actionBody = await actionResponse.json();
    assert.equal(actionBody.status, "forwarded");
    assert.equal(actionBody.upstreamPath, "/actions");
    assert.equal(actionBody.response.body.action, "temporary_superuser");
    assert.equal(actionBody.relay.persistentChange, false);

    const blocked = await fetch(`${baseUrl}/shell`, {
      headers: { "x-rabbit-relay-token": token },
    });
    assert.equal(blocked.status, 404);
    const blockedBody = await blocked.json();
    assert.equal(blockedBody.error, "route_not_allowlisted");
    assert.equal(blockedBody.privilegedExecutionPerformed, false);
  } finally {
    child.kill("SIGTERM");
    await new Promise((resolve) => upstream.close(resolve));
  }
});

test("gateway relay can read auth token from a local token file", async () => {
  const repoRoot = fileURLToPath(new URL("..", import.meta.url));
  const upstreamPort = 21100 + Math.floor(Math.random() * 1000);
  const relayPort = 22100 + Math.floor(Math.random() * 1000);
  const token = "file-backed-relay-token";
  const tempDir = await mkdtemp(`${tmpdir()}/rabbit-relay-token-`);
  const tokenFile = `${tempDir}/relay-token.txt`;
  await writeFile(tokenFile, `${token}\n`);

  const upstream = createServer((_request, response) => {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: true, privilegedExecutionPerformed: false }));
  });

  await listen(upstream, upstreamPort);

  const child = spawn(process.execPath, [`${repoRoot}/scripts/gateway-relay.mjs`], {
    cwd: repoRoot,
    env: {
      ...process.env,
      RABBIT_RELAY_HOST: "127.0.0.1",
      RABBIT_RELAY_PORT: String(relayPort),
      RABBIT_RELAY_TOKEN: "",
      RABBIT_RELAY_TOKEN_FILE: tokenFile,
      RABBIT_RELAY_UPSTREAM: `http://127.0.0.1:${upstreamPort}`,
    },
    stdio: "ignore",
  });

  const baseUrl = `http://127.0.0.1:${relayPort}`;

  try {
    const health = await waitForRelay(baseUrl);
    assert.equal(health.status, "relay_local_only");

    const unauthenticated = await fetch(`${baseUrl}/health`);
    assert.equal(unauthenticated.status, 401);

    const authenticated = await fetch(`${baseUrl}/health`, {
      headers: { "x-rabbit-relay-token": token },
    });
    assert.equal(authenticated.status, 200);
  } finally {
    child.kill("SIGTERM");
    await new Promise((resolve) => upstream.close(resolve));
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("gateway relay accepts scoped remembered-device keys without exposing raw tokens", async () => {
  const repoRoot = fileURLToPath(new URL("..", import.meta.url));
  const upstreamPort = 23100 + Math.floor(Math.random() * 1000);
  const relayPort = 24100 + Math.floor(Math.random() * 1000);
  const tempDir = await mkdtemp(`${tmpdir()}/rabbit-relay-key-`);
  const keyFile = `${tempDir}/relay-keys.json`;
  await writeFile(
    keyFile,
    `${JSON.stringify({
      enabled: true,
      scope: "a1_local_test_only",
      activeKeys: [{ key: "remember-this-rabbit", expiresAt: "2099-01-01T00:00:00.000Z" }],
    })}\n`,
  );

  const upstream = createServer((_request, response) => {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: true, privilegedExecutionPerformed: false }));
  });

  await listen(upstream, upstreamPort);

  const child = spawn(process.execPath, [`${repoRoot}/scripts/gateway-relay.mjs`], {
    cwd: repoRoot,
    env: {
      ...process.env,
      RABBIT_RELAY_HOST: "127.0.0.1",
      RABBIT_RELAY_PORT: String(relayPort),
      RABBIT_RELAY_TOKEN: "",
      RABBIT_RELAY_LOCAL_TEST_KEY_FILE: keyFile,
      RABBIT_RELAY_UPSTREAM: `http://127.0.0.1:${upstreamPort}`,
    },
    stdio: "ignore",
  });

  const baseUrl = `http://127.0.0.1:${relayPort}`;

  try {
    const health = await waitForRelay(baseUrl);
    assert.equal(health.acceptsLocalTestKey, true);

    const preflight = await fetch(`${baseUrl}/health`, {
      method: "OPTIONS",
      headers: { origin: "https://beaudown.github.io" },
    });
    assert.match(
      preflight.headers.get("access-control-allow-headers") || "",
      /x-rabbit-relay-token-key/,
    );

    const unauthenticated = await fetch(`${baseUrl}/health`);
    assert.equal(unauthenticated.status, 401);

    const authenticated = await fetch(`${baseUrl}/health`, {
      headers: { "x-rabbit-relay-token-key": "remember-this-rabbit" },
    });
    assert.equal(authenticated.status, 200);
    const body = await authenticated.json();
    assert.equal(body.status, "forwarded");
    assert.equal(body.relay.exposesGatewaySecrets, false);
  } finally {
    child.kill("SIGTERM");
    await new Promise((resolve) => upstream.close(resolve));
    await rm(tempDir, { recursive: true, force: true });
  }
});
