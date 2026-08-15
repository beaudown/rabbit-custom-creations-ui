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
    assert.equal(health.startupCleanup.performed, true);
    assert.equal(health.startupCleanup.previousBrokerConfigurationsCleared, true);
    assert.equal(health.startupCleanup.affectsRabbitState, false);

    const adbStatusResponse = await fetch(`${baseUrl}/adb/status`);
    assert.equal(adbStatusResponse.status, 200);
    const adbStatus = await adbStatusResponse.json();
    assert.equal(adbStatus.adb.usb.status, "unknown_until_live_device_check");
    assert.equal(adbStatus.adb.tcpip.requiresUsbOrPriorAuthorization, true);
    assert.equal(adbStatus.privilegedExecutionPerformed, false);

    const serviceStatusResponse = await fetch(`${baseUrl}/broker/service`);
    assert.equal(serviceStatusResponse.status, 200);
    const serviceStatus = await serviceStatusResponse.json();
    assert.equal(serviceStatus.serviceControl.bridge.status, "running");
    assert.equal(serviceStatus.serviceControl.rabbitOnDeviceBroker.status, "specified_not_installed");
    assert.equal(serviceStatus.startupCleanup.previousBrokerConfigurationsCleared, true);
    assert.equal(serviceStatus.privilegedExecutionPerformed, false);

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

    const routeResponse = await fetch(`${baseUrl}/bridge/route`);
    assert.equal(routeResponse.status, 200);
    const route = await routeResponse.json();
    assert.equal(route.bridgeRole, "route_validate_dry_run_and_select_broker");
    assert.equal(route.routeTarget, "mac_local_fallback_broker");
    assert.equal(route.privilegedExecutionPerformed, false);
    assert.ok(route.blockers.includes("Mac fallback privileged execution is disabled."));

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

    const adbDryRunResponse = await fetch(`${baseUrl}/adb/authorize`, {
      method: "POST",
      body: JSON.stringify({
        requestId: "test-adb-auth-001",
        routeTarget: "mac_local_fallback_broker",
      }),
    });
    assert.equal(adbDryRunResponse.status, 202);
    const adbDryRun = await adbDryRunResponse.json();
    assert.equal(adbDryRun.status, "dry_run_only");
    assert.equal(adbDryRun.privilegedExecutionPerformed, false);
    assert.equal(adbDryRun.route.routeTarget, "mac_local_fallback_broker");

    const rebootDryRunResponse = await fetch(`${baseUrl}/device/reboot-mode`, {
      method: "POST",
      body: JSON.stringify({
        requestId: "test-usb-storage-mode-001",
        requestedMode: "usb_storage_mode",
      }),
    });
    assert.equal(rebootDryRunResponse.status, 202);
    const rebootDryRun = await rebootDryRunResponse.json();
    assert.equal(rebootDryRun.status, "dry_run_only");
    assert.equal(rebootDryRun.privilegedExecutionPerformed, false);

    const serviceControlResponse = await fetch(`${baseUrl}/broker/service`, {
      method: "POST",
      body: JSON.stringify({
        requestId: "test-service-restart-001",
        serviceAction: "restart_bridge",
      }),
    });
    assert.equal(serviceControlResponse.status, 202);
    const serviceControl = await serviceControlResponse.json();
    assert.equal(serviceControl.status, "dry_run_only");
    assert.equal(serviceControl.serviceAction, "restart_bridge");
    assert.ok(
      serviceControl.blockers.includes(
        "Starting a new broker must clear previous transient broker configuration before accepting requests.",
      ),
    );
    assert.equal(serviceControl.privilegedExecutionPerformed, false);

    const skillUploadResponse = await fetch(`${baseUrl}/skills/upload`, {
      method: "POST",
      body: JSON.stringify({
        requestId: "test-skill-upload-001",
        file: {
          name: "demo-skill.md",
          size: 128,
        },
      }),
    });
    assert.equal(skillUploadResponse.status, 202);
    const skillUpload = await skillUploadResponse.json();
    assert.equal(skillUpload.status, "dry_run_only");
    assert.equal(skillUpload.extension, ".md");
    assert.equal(skillUpload.hookPolicy.automaticSystemHooking, false);
    assert.equal(skillUpload.privilegedExecutionPerformed, false);

    const handoffResponse = await fetch(`${baseUrl}/audit/handoff`, {
      method: "POST",
      body: JSON.stringify({
        target: "chatgpt_codex_client",
        requestId: "test-request-001",
      }),
    });
    assert.equal(handoffResponse.status, 200);
    const handoff = await handoffResponse.json();
    assert.equal(handoff.status, "handoff_ready");
    assert.equal(handoff.target, "chatgpt_codex_client");
    assert.equal(handoff.privilegedExecutionPerformed, false);

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
    assert.equal(pairing.pairing.leaseActionsAffectSuperuserSession, false);
    assert.equal(pairing.current.brokerId, "mac-local-test");

    const refreshResponse = await fetch(`${baseUrl}/lease/refresh`, {
      method: "POST",
    });
    assert.equal(refreshResponse.status, 200);
    const refreshBody = await refreshResponse.json();
    assert.equal(refreshBody.status, "refreshed");
    assert.equal(refreshBody.superuserSessionAffected, false);

    const renewResponse = await fetch(`${baseUrl}/lease/renew`, {
      method: "POST",
      body: JSON.stringify({ reason: "test renew" }),
    });
    assert.equal(renewResponse.status, 200);
    const renewBody = await renewResponse.json();
    assert.equal(renewBody.status, "renewed");
    assert.equal(renewBody.superuserSessionAffected, false);

    const releaseResponse = await fetch(`${baseUrl}/lease/release`, {
      method: "POST",
      body: JSON.stringify({ reason: "test release" }),
    });
    assert.equal(releaseResponse.status, 200);
    const releaseBody = await releaseResponse.json();
    assert.equal(releaseBody.status, "released");
    assert.equal(releaseBody.superuserSessionAffected, false);
    assert.equal(releaseBody.coordination.activeLease, null);

    const syncExportResponse = await fetch(`${baseUrl}/sync/export`);
    assert.equal(syncExportResponse.status, 200);
    const syncExport = await syncExportResponse.json();
    assert.ok(syncExport.queue.inbox.includes("test-request-001.json"));
    assert.ok(syncExport.templates.includes("adb-enable-request.json"));
  } finally {
    child.kill("SIGTERM");
  }
});
