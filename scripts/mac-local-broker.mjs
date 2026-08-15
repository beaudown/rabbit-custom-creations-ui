import { createServer } from "node:http";
import { hostname } from "node:os";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const root = process.cwd();
const port = Number.parseInt(process.env.MAC_BROKER_PORT || "8792", 10);
const brokerId = process.env.MAC_BROKER_ID || `mac-local-${hostname()}`;
const leaseTtlSeconds = Number.parseInt(process.env.MAC_BROKER_LEASE_TTL || "259200", 10);
const brokerStartedAt = new Date().toISOString();

const paths = {
  auditLog: join(root, "public/broker/audit-log.jsonl"),
  coordination: join(root, "public/broker/broker-coordination.json"),
  config: join(root, "public/broker/mac-local-broker-config.json"),
  promptLibrary: join(root, "public/broker/prompt-library.json"),
  syncManifest: join(root, "public/broker/sync-manifest.json"),
  leasePairing: join(root, "public/broker/lease-pairing.json"),
  templates: join(root, "public/broker/request-templates"),
  queueInbox: join(root, "public/broker/queue/inbox"),
  queueOutbox: join(root, "public/broker/queue/outbox"),
  queueProcessed: join(root, "public/broker/queue/processed"),
  queueDeadLetter: join(root, "public/broker/queue/dead-letter"),
};

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-origin": "*",
    "content-type": "application/json",
  });
  response.end(JSON.stringify(body, null, 2));
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function listJsonNames(path) {
  const entries = await readdir(path, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".json"))
    .map((entry) => entry.name)
    .sort();
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  if (!chunks.length) {
    return {};
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function appendAudit(action, status, detail, request = null) {
  const record = {
    id: `audit-${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}-${randomUUID().slice(0, 8)}`,
    timestamp: new Date().toISOString(),
    actor: brokerId,
    source: "mac-local-fallback-broker",
    action,
    status,
    detail,
    requestId: request?.id || request?.requestId || null,
    result: {
      persistentChange: false,
      privilegedExecutionPerformed: false,
      requiresLiveAuthorization: true,
    },
  };
  await writeFile(paths.auditLog, `${JSON.stringify(record)}\n`, { flag: "a" });
  return record;
}

function leaseExpired(lease) {
  return !lease?.expiresAt || Date.parse(lease.expiresAt) <= Date.now();
}

function requestIdFor(request) {
  const id = String(request.requestId || request.id || `request-${randomUUID()}`);
  if (!/^[A-Za-z0-9._-]{3,96}$/.test(id)) {
    throw new Error("requestId must match ^[A-Za-z0-9._-]{3,96}$");
  }
  return id;
}

async function writeQueueRequest(request, audit) {
  const requestId = requestIdFor(request);
  await mkdir(paths.queueInbox, { recursive: true });
  const queuedRequest = {
    ...request,
    requestId,
    syncState: "queued",
    queuedAt: new Date().toISOString(),
    queuedBy: brokerId,
    auditId: audit.id,
  };
  const queuePath = join(paths.queueInbox, `${requestId}.json`);
  await writeFile(queuePath, `${JSON.stringify(queuedRequest, null, 2)}\n`, {
    flag: "wx",
  });
  return { requestId, queuePath: `broker/queue/inbox/${requestId}.json` };
}

async function buildSyncExport() {
  const [syncManifest, coordination, promptLibrary, templates, inbox, outbox, processed, deadLetter] =
    await Promise.all([
      readJson(paths.syncManifest),
      readJson(paths.coordination),
      readJson(paths.promptLibrary),
      listJsonNames(paths.templates),
      listJsonNames(paths.queueInbox),
      listJsonNames(paths.queueOutbox),
      listJsonNames(paths.queueProcessed),
      listJsonNames(paths.queueDeadLetter),
    ]);

  return {
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    brokerId,
    syncManifest,
    coordination: {
      activeLease: coordination.activeLease,
      knownBrokers: coordination.knownBrokers,
    },
    promptSummary: {
      promptCount: promptLibrary.prompts.length,
      variableCount: promptLibrary.variables.length,
    },
    queue: {
      inbox,
      outbox,
      processed,
      deadLetter,
    },
    templates,
  };
}

async function buildBridgeRoute() {
  const coordination = await readJson(paths.coordination);
  const lease = coordination.activeLease;
  const macLeaseActive =
    lease?.role === "mac-local-fallback" &&
    !leaseExpired(lease);
  const rabbitBroker = coordination.knownBrokers.find((broker) => broker.id === "rabbit-native");
  const rabbitEligible =
    rabbitBroker?.status === "running" ||
    rabbitBroker?.status === "specified_not_installed";

  return {
    schemaVersion: 1,
    brokerId,
    bridgeRole: "route_validate_dry_run_and_select_broker",
    routeTarget: macLeaseActive ? "mac_local_fallback_broker" : "rabbit_native_broker",
    selectedReason: macLeaseActive
      ? "Mac fallback broker is reachable and owns the active result-writing lease."
      : "Mac fallback is unavailable or not lease-active; use Rabbit on-device broker when installed.",
    eligibleRoutes: [
      {
        id: "mac_local_fallback_broker",
        reachable: true,
        canExecutePrivilegedActions: false,
        canQueueDryRuns: true,
        leaseActive: macLeaseActive,
      },
      {
        id: "rabbit_native_broker",
        reachable: rabbitBroker?.status === "running",
        canExecutePrivilegedActions: rabbitBroker?.canExecutePrivilegedRequests === true,
        canQueueDryRuns: rabbitEligible,
        leaseActive: lease?.holder === "rabbit-native" && !leaseExpired(lease),
      },
    ],
    expectedOutput: "Dry-run or queued request with audit ID; no privileged execution from bridge detection.",
    blockers: [
      "Rabbit-native broker is specified but not installed.",
      "Mac fallback privileged execution is disabled.",
      "Live device authorization is still required for device-affecting actions.",
    ],
    hints: [
      "Use this route response to fill route_target before queueing.",
      "Use /requests for dry-run intake.",
      "Use /audit/handoff to package evidence for assistant review.",
    ],
    privilegedExecutionPerformed: false,
  };
}

function buildAdbStatus() {
  return {
    schemaVersion: 1,
    brokerId,
    adb: {
      usb: {
        status: "unknown_until_live_device_check",
        authorizationPrompt: "requires_live_system_support",
      },
      tcpip: {
        status: "unknown_until_live_device_check",
        requiresUsbOrPriorAuthorization: true,
      },
      awarenessBroadcast: {
        enabled: true,
        fields: [
          "usb_state",
          "tcpip_state",
          "authorization_state",
          "network_reachability",
          "transport_blockers",
          "discovery_hints",
        ],
      },
    },
    blockers: [
      "No live Rabbit state check has been performed by this broker.",
      "Ordinary hosted PWA code cannot authorize ADB by itself.",
    ],
    privilegedExecutionPerformed: false,
  };
}

async function updateCoordination(mutator) {
  const coordination = await readJson(paths.coordination);
  const next = await mutator(coordination);
  await writeFile(paths.coordination, `${JSON.stringify(next, null, 2)}\n`);
  return next;
}

async function writeLeasePairing(coordination) {
  const pairing = {
    schemaVersion: 1,
    status: "live_generated",
    purpose: "QR and connector-readable lease pairing metadata for broker ownership coordination.",
    lease: {
      defaultLeaseTtlSeconds: leaseTtlSeconds,
      leaseLabel: "72_hour_lease",
      controls: "shared_queue_and_execution_result_write_ownership_only",
      doesNotGateRabbitNativeSuperuserSession: true,
    },
    pairing: {
      qrTarget: "broker/lease-pairing.json",
      rabbitConnectorAutoRetrieve: true,
      manualEntryRequired: false,
      refreshOnMacBrokerStartup: true,
      refreshWhenMacBrokerBecomesAvailable: true,
      leaseManagerEndpoints: [
        "GET /lease/pairing",
        "POST /lease/refresh",
        "POST /lease/renew",
        "POST /lease/release",
      ],
      leaseActionsAffectSuperuserSession: false,
    },
    current: {
      brokerId,
      brokerRole: "mac-local-fallback",
      brokerStartedAt,
      generatedAt: new Date().toISOString(),
      activeLease: coordination.activeLease,
    },
  };
  await writeFile(paths.leasePairing, `${JSON.stringify(pairing, null, 2)}\n`);
  return pairing;
}

async function acquireLease(reason = "mac broker heartbeat") {
  return updateCoordination((coordination) => {
    const rabbitBroker = coordination.knownBrokers.find((broker) => broker.id === "rabbit-native");
    const existingLease = coordination.activeLease;
    const rabbitActive =
      rabbitBroker?.status === "running" &&
      rabbitBroker.canExecutePrivilegedRequests === true &&
      existingLease?.holder === "rabbit-native" &&
      !leaseExpired(existingLease);

    const macBroker = coordination.knownBrokers.find((broker) => broker.id === "mac-local-fallback");
    if (macBroker) {
      macBroker.status = "running";
      macBroker.lastSeen = new Date().toISOString();
      macBroker.instanceId = brokerId;
      macBroker.canExecutePrivilegedRequests = false;
    }

    if (!rabbitActive && (leaseExpired(existingLease) || existingLease?.holder?.startsWith("mac-local"))) {
      coordination.activeLease = {
        holder: brokerId,
        role: "mac-local-fallback",
        reason,
        acquiredAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + leaseTtlSeconds * 1000).toISOString(),
      };
    }

    return coordination;
  }).then(async (coordination) => {
    await writeLeasePairing(coordination);
    return coordination;
  });
}

async function releaseLease(reason = "manual lease release") {
  return updateCoordination((coordination) => {
    const existingLease = coordination.activeLease;
    const released =
      existingLease?.holder === brokerId ||
      existingLease?.role === "mac-local-fallback" ||
      String(existingLease?.holder || "").startsWith("mac-local");

    if (released) {
      coordination.activeLease = null;
    }

    const macBroker = coordination.knownBrokers.find((broker) => broker.id === "mac-local-fallback");
    if (macBroker) {
      macBroker.status = "running";
      macBroker.lastSeen = new Date().toISOString();
      macBroker.instanceId = brokerId;
      macBroker.canExecutePrivilegedRequests = false;
    }

    coordination.lastLeaseRelease = {
      requestedBy: brokerId,
      reason,
      released,
      releasedAt: new Date().toISOString(),
      doesNotAffectRabbitNativeSuperuserSession: true,
    };

    return coordination;
  }).then(async (coordination) => {
    await writeLeasePairing(coordination);
    return coordination;
  });
}

async function handleRequest(request, response) {
  const url = new URL(request.url || "/", `http://${request.headers.host}`);

  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (request.method === "GET" && url.pathname === "/health") {
    const coordination = existsSync(paths.coordination) ? await readJson(paths.coordination) : null;
    sendJson(response, 200, {
      ok: true,
      brokerId,
      role: "mac-local-fallback",
      privilegedExecutionEnabled: false,
      containsRootPayload: false,
      leaseTtlSeconds,
      coordinationStatus: coordination?.status || "missing",
      leasePairing: "broker/lease-pairing.json",
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/bridge/route") {
    sendJson(response, 200, await buildBridgeRoute());
    return;
  }

  if (request.method === "GET" && url.pathname === "/bridge/status") {
    sendJson(response, 200, {
      schemaVersion: 1,
      brokerId,
      bridgeRole: "route_validate_dry_run_and_select_broker",
      status: "running",
      privilegedExecutionPerformed: false,
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/adb/status") {
    sendJson(response, 200, buildAdbStatus());
    return;
  }

  if (request.method === "GET" && url.pathname === "/state") {
    const [config, coordination, syncManifest] = await Promise.all([
      readJson(paths.config),
      readJson(paths.coordination),
      readJson(paths.syncManifest),
    ]);
    sendJson(response, 200, { brokerId, config, coordination, syncManifest });
    return;
  }

  if (request.method === "GET" && url.pathname === "/sync/manifest") {
    sendJson(response, 200, await readJson(paths.syncManifest));
    return;
  }

  if (request.method === "GET" && url.pathname === "/lease/pairing") {
    sendJson(response, 200, await readJson(paths.leasePairing));
    return;
  }

  if (request.method === "POST" && url.pathname === "/lease/refresh") {
    const coordination = await readJson(paths.coordination);
    const pairing = await writeLeasePairing(coordination);
    const audit = await appendAudit(
      "Lease pairing refresh",
      "refreshed",
      "Regenerated connector-readable lease pairing metadata. Rabbit-local SU state is unaffected.",
    );
    sendJson(response, 200, {
      brokerId,
      status: "refreshed",
      pairing,
      audit,
      superuserSessionAffected: false,
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/lease/renew") {
    const body = await readBody(request);
    const coordination = await acquireLease(body.reason || "manual lease renewal");
    const audit = await appendAudit(
      "Lease renewed",
      "renewed",
      "Renewed broker ownership lease for shared queue/result writes only. Rabbit-local SU state is unaffected.",
      body,
    );
    sendJson(response, 200, {
      brokerId,
      status: "renewed",
      coordination,
      audit,
      superuserSessionAffected: false,
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/lease/release") {
    const body = await readBody(request);
    const coordination = await releaseLease(body.reason || "manual lease release");
    const audit = await appendAudit(
      "Lease released",
      "released",
      "Released Mac broker ownership lease for shared queue/result writes only. Rabbit-local SU state is unaffected.",
      body,
    );
    sendJson(response, 200, {
      brokerId,
      status: "released",
      coordination,
      audit,
      superuserSessionAffected: false,
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/sync/export") {
    sendJson(response, 200, await buildSyncExport());
    return;
  }

  if (request.method === "POST" && url.pathname === "/lease") {
    const body = await readBody(request);
    const coordination = await acquireLease(body.reason || "manual lease request");
    const audit = await appendAudit("Mac broker lease heartbeat", "recorded", "Updated broker presence and lease state.");
    sendJson(response, 200, { brokerId, coordination, audit });
    return;
  }

  if (request.method === "POST" && url.pathname === "/requests") {
    const body = await readBody(request);
    const coordination = await acquireLease(`request intake: ${body.action || body.type || "unknown"}`);
    const leaseHolder = coordination.activeLease?.holder;
    const status = leaseHolder === brokerId ? "queued" : "yielded";
    const detail =
      status === "queued"
        ? "Mac fallback broker accepted request for approval/logging only; privileged execution remains disabled."
        : `Mac fallback broker yielded to active lease holder ${leaseHolder}.`;
    const audit = await appendAudit(body.action || body.type || "Broker request", status, detail, body);
    const queued = status === "queued" ? await writeQueueRequest(body, audit) : null;
    sendJson(response, status === "queued" ? 202 : 409, {
      brokerId,
      status,
      audit,
      queued,
      privilegedExecutionPerformed: false,
      nextStep: "Use explicit live authorization before any device-side privileged execution.",
    });
    return;
  }

  if (
    request.method === "POST" &&
    ["/adb/usb", "/adb/tcpip", "/adb/authorize", "/adb/broadcast", "/device/reboot-mode"].includes(url.pathname)
  ) {
    const body = await readBody(request);
    const route = await buildBridgeRoute();
    const actionMap = {
      "/adb/usb": "ADB USB dry run",
      "/adb/tcpip": "ADB TCP/IP dry run",
      "/adb/authorize": "ADB authorization prompt dry run",
      "/adb/broadcast": "ADB awareness broadcast dry run",
      "/device/reboot-mode": "Device reboot mode dry run",
    };
    const audit = await appendAudit(
      actionMap[url.pathname],
      "dry_run_only",
      "Safe broker MVP endpoint recorded request context only; no device command was executed.",
      body,
    );
    sendJson(response, 202, {
      brokerId,
      status: "dry_run_only",
      route,
      audit,
      expectedOutput: route.expectedOutput,
      blockers: route.blockers,
      privilegedExecutionPerformed: false,
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/audit/handoff") {
    const body = await readBody(request);
    const [auditManifest, route, adbStatus] = await Promise.all([
      readJson(join(root, "public/broker/audit-manifest.json")),
      buildBridgeRoute(),
      Promise.resolve(buildAdbStatus()),
    ]);
    const audit = await appendAudit(
      "Audit handoff prepared",
      "handoff_ready",
      "Packaged audit context for assistant review; no privileged execution was performed.",
      body,
    );
    sendJson(response, 200, {
      schemaVersion: 1,
      brokerId,
      status: "handoff_ready",
      target: body.target || "unspecified_review_client",
      auditManifest,
      route,
      adbStatus,
      audit,
      instructions: [
        "Use audit evidence first.",
        "Separate confirmed facts from missing evidence.",
        "Suggest dry-run or rollback-safe next steps before live action.",
        "Do not claim privileged execution unless a broker result proves it.",
      ],
      privilegedExecutionPerformed: false,
    });
    return;
  }

  if (request.method === "POST" && (url.pathname === "/approve" || url.pathname === "/deny")) {
    const body = await readBody(request);
    const action = url.pathname === "/approve" ? "Approval recorded" : "Denial recorded";
    const status = url.pathname === "/approve" ? "approval_recorded" : "denied";
    const audit = await appendAudit(action, status, "Mac fallback recorded decision; no privileged execution was performed.", body);
    sendJson(response, 200, { brokerId, status, audit, privilegedExecutionPerformed: false });
    return;
  }

  sendJson(response, 404, { error: "not_found" });
}

const server = createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    sendJson(response, 500, { error: "broker_error", message: error.message });
  });
});

server.listen(port, "127.0.0.1", async () => {
  await acquireLease("broker startup").catch(() => {});
  console.log(`Mac fallback broker listening on http://127.0.0.1:${port}`);
  console.log("Privileged execution is disabled; this service coordinates requests and audit records only.");
});
