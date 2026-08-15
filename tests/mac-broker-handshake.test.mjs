import assert from "node:assert/strict";
import { mkdtemp, cp, mkdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";
import test from "node:test";

async function waitForHealth(url) {
  const started = Date.now();
  let lastError;
  while (Date.now() - started < 5000) {
    try {
      const response = await fetch(`${url}/health`);
      if (response.ok) {
        return response.json();
      }
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw lastError || new Error("broker health check timed out");
}

test("mac local broker performs isolated health, lease, and request handshake", async () => {
  const repoRoot = fileURLToPath(new URL("..", import.meta.url));
  const sandbox = await mkdtemp(join(tmpdir(), "rabbit-mac-broker-"));
  await mkdir(join(sandbox, "public"), { recursive: true });
  await cp(join(repoRoot, "public/broker"), join(sandbox, "public/broker"), {
    recursive: true,
  });

  const port = 18000 + Math.floor(Math.random() * 1000);
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = spawn(process.execPath, [join(repoRoot, "scripts/mac-local-broker.mjs")], {
    cwd: sandbox,
    env: {
      ...process.env,
      MAC_BROKER_PORT: String(port),
      MAC_BROKER_ID: "mac-local-test",
    },
    stdio: "ignore",
  });

  try {
    const health = await waitForHealth(baseUrl);
    assert.equal(health.ok, true);
    assert.equal(health.privilegedExecutionEnabled, false);
    assert.equal(health.containsRootPayload, false);

    const leaseResponse = await fetch(`${baseUrl}/lease`, {
      method: "POST",
      body: JSON.stringify({ reason: "test lease" }),
    });
    assert.equal(leaseResponse.status, 200);
    const leaseBody = await leaseResponse.json();
    assert.equal(leaseBody.coordination.activeLease.holder, "mac-local-test");

    const requestResponse = await fetch(`${baseUrl}/requests`, {
      method: "POST",
      body: JSON.stringify({
        id: "test-request-001",
        action: "prepare_adb_enable_request",
      }),
    });
    assert.equal(requestResponse.status, 202);
    const requestBody = await requestResponse.json();
    assert.equal(requestBody.status, "queued");
    assert.equal(requestBody.privilegedExecutionPerformed, false);

    const auditLog = await readFile(join(sandbox, "public/broker/audit-log.jsonl"), "utf8");
    assert.match(auditLog, /test-request-001/);
    assert.match(auditLog, /Mac fallback broker accepted request/);
  } finally {
    child.kill("SIGTERM");
  }
});
