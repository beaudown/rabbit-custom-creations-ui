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
    assert.equal(health.leaseTtlSeconds, 259200);
    assert.equal(health.leasePairing, "broker/lease-pairing.json");

    const leaseResponse = await fetch(`${baseUrl}/lease`, {
      method: "POST",
      body: JSON.stringify({ reason: "test lease" }),
    });
    assert.equal(leaseResponse.status, 200);
    const leaseBody = await leaseResponse.json();
    assert.equal(leaseBody.coordination.activeLease.holder, "mac-local-test");
    const leaseMs =
      Date.parse(leaseBody.coordination.activeLease.expiresAt) -
      Date.parse(leaseBody.coordination.activeLease.acquiredAt);
    assert.ok(leaseMs >= 259_100_000);

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
    assert.equal(requestBody.queued.queuePath, "broker/queue/inbox/test-request-001.json");

    const auditLog = await readFile(join(sandbox, "public/broker/audit-log.jsonl"), "utf8");
    assert.match(auditLog, /test-request-001/);
    assert.match(auditLog, /Mac fallback broker accepted request/);

    const queuedRequest = JSON.parse(
      await readFile(
        join(sandbox, "public/broker/queue/inbox/test-request-001.json"),
        "utf8",
      ),
    );
    assert.equal(queuedRequest.syncState, "queued");
    assert.equal(queuedRequest.queuedBy, "mac-local-test");

    const syncManifestResponse = await fetch(`${baseUrl}/sync/manifest`);
    assert.equal(syncManifestResponse.status, 200);
    const syncManifest = await syncManifestResponse.json();
    assert.equal(syncManifest.paths.inbox, "broker/queue/inbox");

    const pairingResponse = await fetch(`${baseUrl}/lease/pairing`);
    assert.equal(pairingResponse.status, 200);
    const pairing = await pairingResponse.json();
    assert.equal(pairing.lease.defaultLeaseTtlSeconds, 259200);
    assert.equal(pairing.pairing.rabbitConnectorAutoRetrieve, true);
    assert.equal(pairing.current.brokerId, "mac-local-test");

    const syncExportResponse = await fetch(`${baseUrl}/sync/export`);
    assert.equal(syncExportResponse.status, 200);
    const syncExport = await syncExportResponse.json();
    assert.ok(syncExport.queue.inbox.includes("test-request-001.json"));
    assert.ok(syncExport.templates.includes("adb-enable-request.json"));
  } finally {
    child.kill("SIGTERM");
  }
});
