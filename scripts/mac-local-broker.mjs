import { createServer } from "node:http";
import { hostname, homedir } from "node:os";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const root = process.cwd();
const port = Number.parseInt(process.env.MAC_BROKER_PORT || "8792", 10);
const host = process.env.MAC_BROKER_HOST || "127.0.0.1";
const brokerId = process.env.MAC_BROKER_ID || `mac-local-${hostname()}`;
const leaseTtlSeconds = Number.parseInt(process.env.MAC_BROKER_LEASE_TTL || "259200", 10);
const brokerStartedAt = new Date().toISOString();
const openClawGatewayUrl = process.env.OPENCLAW_GATEWAY_URL || "http://127.0.0.1:18789";
const hermesGatewayUrl = process.env.HERMES_GATEWAY_URL || null;
const publicRelayUrl = process.env.RABBIT_GATEWAY_RELAY_URL || null;
let startupCleanup = {
  performed: false,
  performedAt: null,
  scope: "pending_startup",
  previousBrokerConfigurationsCleared: false,
  affectsRabbitState: false,
};

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

const gatewayRelayAllowlist = [
  "GET /rabbit-broker/health",
  "GET /rabbit-broker/actions/catalog",
  "POST /rabbit-broker/actions",
  "GET /rabbit-broker/audit/:auditId",
];

const gatewayRelayFailurePoints = [
  {
    id: "rabbit_to_mac_route",
    label: "Rabbit can reach relay URL",
    blocker: "Rabbit cannot route to Mac-only 100.x or 127.x addresses unless it is on that network.",
  },
  {
    id: "https_required",
    label: "Hosted Creation can call endpoint",
    blocker: "A GitHub Pages HTTPS app may block plain HTTP private endpoints as mixed content.",
  },
  {
    id: "gateway_protocol",
    label: "Gateway exposes broker API",
    blocker: "OpenClaw Control UI and Rabbit ws pairing are not the same as an allowlisted HTTP broker relay.",
  },
  {
    id: "auth_boundary",
    label: "No raw gateway token in Creation",
    blocker: "Token-bearing OpenClaw/Rabbit connector payloads must not be published or copied into the PWA.",
  },
  {
    id: "executor_boundary",
    label: "Relay does not execute privileged actions",
    blocker: "Relay may queue, review, and log only; execution still requires a validated Rabbit-native broker.",
  },
  {
    id: "audit_boundary",
    label: "Every relay decision has an audit ID",
    blocker: "If the relay cannot write an audit record, the action stops.",
  },
];

const actionCatalog = {
  status: {
    label: "Broker and device status",
    risk: "low",
    endpoint: "/status",
    canRunOnMacFallback: true,
    expectedOutcome: "Return current broker route, live-state gaps, and stop reason.",
    warnings: ["Device state is memory-derived until a live Rabbit check runs."],
  },
  temporary_superuser: {
    label: "Temporary superuser bootstrap",
    risk: "critical",
    endpoint: "/temporary-superuser",
    canRunOnMacFallback: false,
    expectedOutcome: "Start a RAM-only Rabbit-side broker only after exact-build compatibility is proven.",
    warnings: [
      "Can destabilize the current boot if the payload is wrong.",
      "Must not write boot, vbmeta, super, vendor, system, GPT, userdata, or slot metadata.",
      "Must disappear after reboot unless persistent root is separately approved.",
    ],
  },
  adb_usb: {
    label: "Enable USB ADB",
    risk: "high",
    endpoint: "/adb/enable-usb",
    canRunOnMacFallback: false,
    expectedOutcome: "Enable USB ADB for the allowlisted MacBook Pro key only.",
    warnings: [
      "Unknown ADB host keys must pause for approval.",
      "ADB authorization or system settings may persist until cleanup or reboot.",
    ],
  },
  adb_tcpip: {
    label: "Enable ADB over TCP/IP",
    risk: "critical",
    endpoint: "/adb/tcpip",
    canRunOnMacFallback: false,
    expectedOutcome: "Open a short ADB TCP/IP window only after USB ADB is authorized.",
    warnings: [
      "Network ADB broadens access and must be time-limited.",
      "Disable TCP/IP during cleanup.",
    ],
  },
  apk_canary: {
    label: "Install no-permission ADB canary",
    risk: "medium",
    endpoint: "/apk/install",
    canRunOnMacFallback: false,
    expectedOutcome: "Install and remove the canary before Rabbit Glide.",
    warnings: ["Requires authorized ADB and exact target serial verification."],
  },
  rabbit_glide_install: {
    label: "Install Rabbit Glide",
    risk: "medium",
    endpoint: "/apk/install",
    canRunOnMacFallback: false,
    expectedOutcome: "Install the verified Rabbit Glide APK after canary passes.",
    warnings: ["If rabbitOS removes or hides the APK, stop and log the exact error."],
  },
  ime_set: {
    label: "Enable and select Rabbit Glide IME",
    risk: "medium",
    endpoint: "/ime/set",
    canRunOnMacFallback: false,
    expectedOutcome: "Store the previous IME, enable Rabbit Glide, and select it.",
    warnings: ["IME selection changes user input behavior and must have a revert path."],
  },
  ime_revert: {
    label: "Revert previous IME",
    risk: "medium",
    endpoint: "/ime/revert",
    canRunOnMacFallback: false,
    expectedOutcome: "Restore the previously recorded input method.",
    warnings: ["Requires a recorded previous IME value."],
  },
  reboot_normal: {
    label: "Normal reboot",
    risk: "medium",
    endpoint: "/device/reboot-mode",
    canRunOnMacFallback: false,
    expectedOutcome: "Reboot normally and verify stock rabbitOS returns.",
    warnings: ["Reboot clears temporary root and broker state."],
  },
  reboot_recovery: {
    label: "Recovery reboot",
    risk: "high",
    endpoint: "/device/reboot-mode",
    canRunOnMacFallback: false,
    expectedOutcome: "Enter recovery only with explicit action-time approval.",
    warnings: ["Wrong recovery action can affect userdata or update state."],
  },
  reboot_fastboot: {
    label: "Fastboot reboot",
    risk: "high",
    endpoint: "/device/reboot-mode",
    canRunOnMacFallback: false,
    expectedOutcome: "Enter fastboot only with explicit action-time approval.",
    warnings: ["Fastboot can alter partitions if later commands are misused."],
  },
  storage_export: {
    label: "Storage export or capture",
    risk: "high",
    endpoint: "/storage/export",
    canRunOnMacFallback: false,
    expectedOutcome: "Prefer read-only capture with manifest and hashes.",
    warnings: ["Never expose or alter userdata without explicit scope and a storage plan."],
  },
  shell: {
    label: "Explicit shell command",
    risk: "critical",
    endpoint: "/shell",
    canRunOnMacFallback: false,
    expectedOutcome: "Run only the exact approved command and log output summary.",
    warnings: [
      "Arbitrary shell can break boot, OTA, data, or privacy.",
      "Each command requires its own explicit approval and live-state check.",
    ],
  },
  cleanup: {
    label: "Cleanup temporary state",
    risk: "medium",
    endpoint: "/cleanup",
    canRunOnMacFallback: false,
    expectedOutcome: "Disable temporary ADB/TCP state, stop broker, remove staging files, and prepare stock reboot verification.",
    warnings: ["Cleanup must log what changed and what remains unknown."],
  },
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

function normalizeActionName(value) {
  return String(value || "status")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function buildActionReview(request, route) {
  const action = normalizeActionName(request.action || request.type || request.serviceAction);
  const catalogEntry = actionCatalog[action] || {
    label: action || "Unknown action",
    risk: "critical",
    endpoint: "/manual-review",
    canRunOnMacFallback: false,
    expectedOutcome: "Unknown actions stop for manual broker review.",
    warnings: [
      "This action is not in the broker allowlist.",
      "Do not execute unknown commands through the Mac fallback broker.",
    ],
  };
  const requestedExecution = request.execute === true || request.mode === "execute";
  const persistentAllowed = request.persistentChangeAllowed === true;
  const deviceActionAllowed = request.deviceActionAllowed === true;
  const exactBuildValidated = request.exactBuildValidated === true;
  const liveDeviceVerified = request.liveDeviceVerified === true;
  const explicitApproval = request.explicitApproval === true;
  const rabbitExecutorReady =
    route.eligibleRoutes.some(
      (candidate) =>
        candidate.id === "rabbit_native_broker" &&
        candidate.reachable === true &&
        candidate.canExecutePrivilegedActions === true,
    );
  const risk = catalogEntry.risk;
  const warnings = [
    ...catalogEntry.warnings,
    "Mac fallback broker is controller-of-record only until Rabbit-native broker is validated.",
  ];
  const blockers = [];

  if (!actionCatalog[action]) {
    blockers.push("Action is not allowlisted.");
  }
  if (!catalogEntry.canRunOnMacFallback && !rabbitExecutorReady) {
    blockers.push("Rabbit-native privileged broker is not installed, reachable, and execution-capable.");
  }
  if (risk !== "low" && !liveDeviceVerified) {
    blockers.push("Live Rabbit screen, USB, serial, slot, and build state have not been verified for this action.");
  }
  if (risk === "critical" && !exactBuildValidated) {
    blockers.push("Exact-build RAM-only bootstrap compatibility has not been validated.");
  }
  if (risk !== "low" && !explicitApproval) {
    blockers.push("Separate action-time approval is missing.");
  }
  if (persistentAllowed) {
    blockers.push("Persistent or OTA-affecting changes are blocked by default.");
  }
  if (requestedExecution && !deviceActionAllowed) {
    blockers.push("Request asked for execution but did not explicitly allow a device action.");
  }

  const canExecute =
    requestedExecution &&
    blockers.length === 0 &&
    (catalogEntry.canRunOnMacFallback || rabbitExecutorReady) &&
    persistentAllowed === false;
  const status = canExecute ? "execution_ready" : requestedExecution ? "blocked_before_execution" : "review_recorded";
  const stopReason = canExecute
    ? "ready_to_route_to_validated_executor"
    : blockers[0] || "recorded_for_review_without_execution_request";

  return {
    schemaVersion: 1,
    action,
    label: catalogEntry.label,
    risk,
    status,
    stopReason,
    routeTarget: canExecute && rabbitExecutorReady ? "rabbit_native_broker" : route.routeTarget,
    expectedOutcome: catalogEntry.expectedOutcome,
    endpoint: catalogEntry.endpoint,
    warnings,
    blockers,
    checks: {
      requestedExecution,
      explicitApproval,
      liveDeviceVerified,
      exactBuildValidated,
      rabbitExecutorReady,
      persistentChangeAllowed: persistentAllowed,
      deviceActionAllowed,
    },
    execution: {
      performed: false,
      reason: canExecute
        ? "Executor routing is ready, but this Mac broker build still records only. Rabbit-native executor dispatch must be implemented and approved separately."
        : stopReason,
      persistentChange: false,
      otaBreakingChange: false,
    },
  };
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function readOptionalJson(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return null;
  }
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

async function buildServiceStatus() {
  const route = await buildBridgeRoute();
  return {
    schemaVersion: 1,
    brokerId,
    serviceControl: {
      bridge: {
        status: "running",
        role: "route_validate_dry_run_and_select_broker",
        endpoint: "/bridge/route",
      },
      macFallbackBroker: {
        status: "running",
        privilegedExecutionEnabled: false,
        endpoint: `http://${host}:${port}`,
      },
      rabbitOnDeviceBroker: {
        status: "specified_not_installed",
        privilegedExecutionEnabled: false,
        endpoint: "http://127.0.0.1:8791",
      },
    },
    startupCleanup,
    route,
    privilegedExecutionPerformed: false,
  };
}

async function buildGatewayRelayProbe(requestContext = {}) {
  const openClawConfig = await readOptionalJson(join(homedir(), ".openclaw/openclaw.json"));
  const hermesState = await readOptionalJson(join(homedir(), ".hermes/gateway_state.json"));
  const requestedRelayUrl = requestContext.relayUrl || publicRelayUrl;
  const relayUsesHttps = typeof requestedRelayUrl === "string" && requestedRelayUrl.startsWith("https://");
  const relayHasAuth =
    requestContext.authenticated === true ||
    Boolean(process.env.RABBIT_GATEWAY_RELAY_AUTH_REQUIRED === "true");
  const openClawConfigured = Boolean(openClawConfig?.gateway);
  const hermesRunning = hermesState?.gateway_state === "running";
  const hermesApiUsable = hermesState?.platforms?.api_server?.state === "connected";
  const safeRelayReady = Boolean(requestedRelayUrl && relayUsesHttps && relayHasAuth);

  return {
    schemaVersion: 1,
    brokerId,
    status: safeRelayReady ? "relay_candidate_ready_for_external_reachability_test" : "relay_not_ready",
    purpose: "Probe whether OpenClaw or Hermes can safely front the broker with an authenticated, allowlisted relay.",
    relayCandidate: {
      requestedRelayUrl: requestedRelayUrl || "not_configured",
      requiresHttps: true,
      relayUsesHttps,
      authRequired: true,
      relayHasAuth,
      allowlist: gatewayRelayAllowlist,
      privilegedExecutionEnabled: false,
      exposesGatewaySecrets: false,
      forwardsToMacBroker: `http://${host}:${port}`,
    },
    gateways: {
      openclaw: {
        configured: openClawConfigured,
        url: openClawGatewayUrl,
        bind: openClawConfig?.gateway?.bind || "unknown",
        mode: openClawConfig?.gateway?.mode || "unknown",
        port: openClawConfig?.gateway?.port || "unknown",
        authMode: openClawConfig?.gateway?.auth?.mode || "unknown",
        tailscaleMode: openClawConfig?.gateway?.tailscale?.mode || "unknown",
        usableAsDropInBrokerRelay: false,
      },
      hermes: {
        running: hermesRunning,
        url: hermesGatewayUrl || "not_configured",
        apiServerState: hermesState?.platforms?.api_server?.state || "unknown",
        apiServerUsable: hermesApiUsable,
        usableAsDropInBrokerRelay: false,
      },
    },
    failurePoints: gatewayRelayFailurePoints,
    nextImplementationStep:
      "Create an OpenClaw or Hermes assistant tool/skill that exposes only the relay allowlist, requires auth, forwards to the Mac broker, and returns this same audit-first response shape.",
    stopConditions: [
      "No HTTPS route reachable from Rabbit.",
      "No auth on a public route.",
      "Relay would expose OpenClaw or Rabbit connector tokens.",
      "Relay attempts root, ADB, reboot, install, fastboot, recovery, shell, or flash directly.",
      "Relay cannot write an audit record.",
    ],
    privilegedExecutionPerformed: false,
    persistentChange: false,
    otaBreakingChange: false,
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
      startupCleanup,
    },
  };
  await writeFile(paths.leasePairing, `${JSON.stringify(pairing, null, 2)}\n`);
  return pairing;
}

async function clearPreviousBrokerConfigurations(reason = "broker startup") {
  startupCleanup = {
    performed: true,
    performedAt: new Date().toISOString(),
    reason,
    scope:
      "clears_previous_route_cache_presence_claims_pending_service_control_and_stale_capability_detection",
    previousBrokerConfigurationsCleared: true,
    preservesAuditHistory: true,
    preservesQueueFiles: true,
    affectsRabbitState: false,
    privilegedExecutionPerformed: false,
  };

  return updateCoordination((coordination) => {
    coordination.status = "seed";
    coordination.startupCleanup = {
      ...startupCleanup,
      brokerId,
    };
    coordination.transientRouteCache = null;
    coordination.pendingServiceControl = null;
    coordination.lastStartupBrokerId = brokerId;

    const macBroker = coordination.knownBrokers.find((broker) => broker.id === "mac-local-fallback");
    if (macBroker) {
      macBroker.status = "starting";
      macBroker.lastSeen = new Date().toISOString();
      macBroker.instanceId = brokerId;
      macBroker.previousConfigurationClearedAt = startupCleanup.performedAt;
      macBroker.canExecutePrivilegedRequests = false;
    }

    return coordination;
  }).then(async (coordination) => {
    await appendAudit(
      "Broker startup cleanup",
      "cleared_previous_runtime_configuration",
      "Cleared previous transient route/service configuration before accepting new broker requests. Audit history, queue files, and Rabbit device state were preserved.",
      { reason },
    );
    await writeLeasePairing(coordination);
    return coordination;
  });
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
      startupCleanup,
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

  if (request.method === "GET" && url.pathname === "/broker/service") {
    sendJson(response, 200, await buildServiceStatus());
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

  if (request.method === "GET" && url.pathname === "/actions/catalog") {
    sendJson(response, 200, {
      schemaVersion: 1,
      brokerId,
      purpose: "Mac broker action catalog with risk warnings and execution blockers.",
      actions: actionCatalog,
      defaults: {
        macFallbackIsControllerOfRecord: true,
        macFallbackExecutesPrivilegedActions: false,
        persistentOrOtaBreakingChangesBlockedByDefault: true,
        actionLogRequired: true,
      },
    });
    return;
  }

  if (request.method === "GET" && url.pathname === "/gateway/relay/probe") {
    sendJson(response, 200, await buildGatewayRelayProbe());
    return;
  }

  if (request.method === "POST" && url.pathname === "/gateway/relay/probe") {
    const body = await readBody(request);
    const probe = await buildGatewayRelayProbe(body);
    const audit = await appendAudit(
      "Gateway relay probe",
      probe.status,
      "Checked OpenClaw/Hermes relay prerequisites and stopped before any privileged execution.",
      body,
    );
    sendJson(response, probe.status === "relay_not_ready" ? 409 : 202, {
      ...probe,
      audit,
    });
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

  if (request.method === "POST" && url.pathname === "/actions") {
    const body = await readBody(request);
    const route = await buildBridgeRoute();
    const review = buildActionReview(body, route);
    const audit = await appendAudit(
      `Action control: ${review.action}`,
      review.status,
      `Stopped at ${review.stopReason}. No privileged execution was performed.`,
      body,
    );
    const queued =
      review.status === "review_recorded" || review.status === "blocked_before_execution"
        ? await writeQueueRequest(
            {
              ...body,
              requestId: requestIdFor(body),
              action: review.action,
              risk: review.risk,
              brokerReview: review,
            },
            audit,
          ).catch((error) => ({
            error: "queue_write_failed",
            message: error.message,
          }))
        : null;
    sendJson(response, review.status === "blocked_before_execution" ? 409 : 202, {
      brokerId,
      status: review.status,
      review,
      audit,
      queued,
      privilegedExecutionPerformed: false,
      persistentChange: false,
      otaBreakingChange: false,
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

  if (request.method === "POST" && url.pathname === "/broker/service") {
    const body = await readBody(request);
    const requestedAction = body.serviceAction || body.action || "status";
    const allowedActions = new Set([
      "status",
      "start_bridge",
      "restart_bridge",
      "stop_bridge",
      "start_on_device_broker",
      "restart_on_device_broker",
      "stop_on_device_broker",
      "refresh_routes",
    ]);
    const allowed = allowedActions.has(requestedAction);
    const serviceStatus = await buildServiceStatus();
    const audit = await appendAudit(
      "Broker service control",
      allowed ? "dry_run_only" : "blocked",
      allowed
        ? `Service-control request ${requestedAction} recorded as dry run; no service lifecycle command was executed.`
        : `Service-control request ${requestedAction} is not allowlisted.`,
      body,
    );
    sendJson(response, allowed ? 202 : 400, {
      brokerId,
      status: allowed ? "dry_run_only" : "blocked",
      serviceAction: requestedAction,
      serviceStatus,
      expectedOutput: allowed
        ? "Broker returns audit ID, route target, blockers, and verification plan without changing service state."
        : "Blocked request with audit record.",
      blockers: [
        "Mac fallback service-control endpoint is non-privileged.",
        "Rabbit on-device broker is specified but not installed.",
        "Creation may request service control but may not directly control privileged services.",
        "Starting a new broker must clear previous transient broker configuration before accepting requests.",
      ],
      hints: [
        "Use status or refresh_routes before start/stop/restart.",
        "Use cleanup evidence from /health or /broker/service to confirm stale configuration was cleared.",
        "Use on-device broker service controls only after a validated install path exists.",
      ],
      audit,
      privilegedExecutionPerformed: false,
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/skills/upload") {
    const body = await readBody(request);
    const fileName = String(body.file?.name || body.fileName || "unknown");
    const extension = fileName.includes(".")
      ? `.${fileName.split(".").pop().toLowerCase()}`
      : "";
    const accepted = new Set([
      ".txt",
      ".md",
      ".csv",
      ".json",
      ".yaml",
      ".yml",
      ".toml",
      ".xml",
      ".pdf",
      ".zip",
    ]);
    const allowed = accepted.has(extension);
    const audit = await appendAudit(
      "Custom skill upload",
      allowed ? "dry_run_only" : "blocked",
      allowed
        ? `Custom skill upload ${fileName} recorded for dry-run parsing and broker approval.`
        : `Custom skill upload ${fileName} blocked because extension ${extension || "none"} is unsupported.`,
      body,
    );
    sendJson(response, allowed ? 202 : 400, {
      brokerId,
      status: allowed ? "dry_run_only" : "blocked",
      fileName,
      extension,
      expectedOutput: "Normalized skill metadata, requested hooks, required permissions, blockers, audit ID, and rollback note.",
      hookPolicy: {
        mayUseAfterTemporarySuperuserEnabled: true,
        automaticSystemHooking: false,
        requiresBrokerApproval: true,
        requiresAuditRecord: true,
      },
      blockers: [
        "Mac fallback skill upload endpoint is non-privileged.",
        "System hooks require validated temporary SU and broker approval.",
        "Binary formats require broker-side parser before activation.",
      ],
      audit,
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

server.listen(port, host, async () => {
  await clearPreviousBrokerConfigurations("broker startup").catch(() => {});
  await acquireLease("broker startup").catch(() => {});
  console.log(`Mac fallback broker listening on http://${host}:${port}`);
  console.log("Privileged execution is disabled; this service coordinates requests and audit records only.");
});
