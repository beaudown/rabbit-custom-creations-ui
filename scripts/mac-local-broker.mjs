import { createServer } from "node:http";
import { hostname } from "node:os";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const root = process.cwd();
const port = Number.parseInt(process.env.MAC_BROKER_PORT || "8792", 10);
const brokerId = process.env.MAC_BROKER_ID || `mac-local-${hostname()}`;
const leaseTtlSeconds = Number.parseInt(process.env.MAC_BROKER_LEASE_TTL || "120", 10);

const paths = {
  auditLog: join(root, "public/broker/audit-log.jsonl"),
  coordination: join(root, "public/broker/broker-coordination.json"),
  config: join(root, "public/broker/mac-local-broker-config.json"),
  promptLibrary: join(root, "public/broker/prompt-library.json"),
  syncManifest: join(root, "public/broker/sync-manifest.json"),
  templates: join(root, "public/broker/request-templates"),
  queueInbox: join(root, "public/broker/queue/inbox"),
  queueOutbox: join(root, "public/broker/queue/outbox"),
  queueProcessed: join(root, "public/broker/queue/processed"),
  queueDeadLetter: join(root, "public/broker/queue/dead-letter"),
};

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, { "content-type": "application/json" });
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

async function updateCoordination(mutator) {
  const coordination = await readJson(paths.coordination);
  const next = await mutator(coordination);
  await writeFile(paths.coordination, `${JSON.stringify(next, null, 2)}\n`);
  return next;
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
  });
}

async function handleRequest(request, response) {
  const url = new URL(request.url || "/", `http://${request.headers.host}`);

  if (request.method === "GET" && url.pathname === "/health") {
    const coordination = existsSync(paths.coordination) ? await readJson(paths.coordination) : null;
    sendJson(response, 200, {
      ok: true,
      brokerId,
      role: "mac-local-fallback",
      privilegedExecutionEnabled: false,
      containsRootPayload: false,
      coordinationStatus: coordination?.status || "missing",
    });
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
