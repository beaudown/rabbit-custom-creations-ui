"use client";

import { useMemo, useState } from "react";

type Creation = {
  id: string;
  name: string;
  category: string;
  description: string;
  installedAt: string;
  version: string;
  status: "Ready" | "Update" | "Local";
  color: string;
};

const categories = [
  "Media Tools",
  "Developer Tools",
  "Productivity",
  "Device Utilities",
  "AI Assistants",
  "Experiments",
  "Favorites",
  "Uncategorized",
  "Custom Category 1",
  "Custom Category 2",
];

const creations: Creation[] = [
  {
    id: "clip-forge",
    name: "Clip Forge",
    category: "Media Tools",
    description: "Trim, convert, and queue quick media exports.",
    installedAt: "2026-08-13",
    version: "1.4.0",
    status: "Ready",
    color: "cyan",
  },
  {
    id: "root-broker-plan",
    name: "Root Broker Plan",
    category: "Developer Tools",
    description: "Read-only planning surface for gated host actions.",
    installedAt: "2026-08-14",
    version: "0.2.1",
    status: "Local",
    color: "green",
  },
  {
    id: "prompt-vault",
    name: "Prompt Vault",
    category: "AI Assistants",
    description: "Store reusable Rabbit prompts and launch notes.",
    installedAt: "2026-08-10",
    version: "2.0.3",
    status: "Ready",
    color: "violet",
  },
  {
    id: "qr-runner",
    name: "QR Runner",
    category: "Device Utilities",
    description: "Open hosted links and verify scan-ready payloads.",
    installedAt: "2026-08-12",
    version: "1.1.2",
    status: "Update",
    color: "amber",
  },
  {
    id: "notes-brief",
    name: "Notes Brief",
    category: "Productivity",
    description: "Condense project notes into a reachable action list.",
    installedAt: "2026-08-08",
    version: "1.0.5",
    status: "Ready",
    color: "rose",
  },
  {
    id: "sandbox-lab",
    name: "Sandbox Lab",
    category: "Experiments",
    description: "Try small offline creation ideas before promoting.",
    installedAt: "2026-08-05",
    version: "0.9.8",
    status: "Local",
    color: "blue",
  },
];

type SortMode = "category" | "newest" | "oldest" | "name";

type PromptVariable = {
  name: string;
  label: string;
  required: boolean;
  source: string;
  meaning: string;
  placeholder: string;
};

type PromptGuide = {
  id: string;
  title: string;
  category: string;
  risk: "Low" | "High";
  action: string;
  templatePath: string;
  summary: string;
  does: string[];
  variables: PromptVariable[];
  prompt: string;
};

type ApprovalPreview = {
  status: string | number;
  action?: string;
  risk?: string;
  stopReason: string;
  expectedOutcome?: string;
  warnings: string[];
  blockers: string[];
  checks?: Record<string, boolean>;
  auditId?: string;
  queued?: string;
  github?: {
    queue: string;
    audit: string;
    coordination: string;
  };
  execution?: {
    privilegedExecutionPerformed?: boolean;
    persistentChange?: boolean;
    otaBreakingChange?: boolean;
  };
};

type ExpandablePreviewProps = {
  title: string;
  summary: string;
  value: string;
};

type StatusReadoutProps = {
  label: string;
  value: string;
  details?: string;
};

const auditRecords = [
  {
    id: "audit-20260815-000003",
    action: "Storage export dry run",
    status: "Dry run",
    time: "00:02Z",
    detail: "No device change. Live connection still required.",
  },
  {
    id: "audit-20260815-000002",
    action: "Temporary privilege request",
    status: "Blocked",
    time: "00:01Z",
    detail: "Missing live device check and validated non-persistent method.",
  },
  {
    id: "audit-20260815-000001",
    action: "Prompt library opened",
    status: "Recorded",
    time: "00:00Z",
    detail: "GitHub Pages request surface only.",
  },
];

const workflowSteps = [
  "Open Superuser Management",
  "Pair GitHub",
  "Pick Action",
  "Dry Run",
  "Approve",
  "Log Result",
];

const brokerSettings = [
  { label: "Active records", value: "1,500" },
  { label: "Warn at", value: "1,200" },
  { label: "Archive chunks", value: "500" },
  { label: "SU lifetime", value: "Until reboot" },
  { label: "Lease", value: "72 hours" },
];

const brokerStatus = [
  { label: "GitHub UI", value: "Ready" },
  { label: "Request files", value: "Ready" },
  { label: "Rabbit broker", value: "Primary" },
  { label: "Rabbit bridge", value: "Router" },
  { label: "Rabbit gateway", value: "Connector" },
  { label: "OpenClaw", value: "Gateway" },
  { label: "Hermes", value: "Gateway" },
  { label: "Mac broker", value: "Fallback" },
];

const brokerModules = [
  "Superuser",
  "Prompts",
  "Requests",
  "Queue",
  "Lease",
  "Logs",
  "Device workflows",
];

const syncPaths = [
  { label: "Inbox", value: "broker/queue/inbox" },
  { label: "Outbox", value: "broker/queue/outbox" },
  { label: "Processed", value: "broker/queue/processed" },
  { label: "Dead letter", value: "broker/queue/dead-letter" },
];

const requestStates = [
  "draft",
  "queued",
  "approved",
  "denied",
  "executed",
  "blocked",
  "processed",
  "dead_letter",
];

const leaseManagerStats = [
  { label: "Holder", value: "Mac fallback" },
  { label: "Duration", value: "72 hours" },
  { label: "Pairing", value: "QR + connector" },
  { label: "SU impact", value: "None" },
];

const rootRequestButtons = [
  "Temp SU",
  "ADB USB",
  "ADB TCP/IP",
  "ADB Auth",
  "ADB Broadcast",
  "Reboot",
  "Fastboot",
  "Recovery",
  "USB Storage Mode",
  "Audit Lookup",
  "Rollback Help",
  "Debug Help",
  "APK Canary",
];

const bridgeRoutes = [
  {
    label: "Route check",
    target: "Mac broker if local lease is reachable",
    detail: "Bridge checks broker health, lease pairing, and queue state before deciding where a request should go.",
  },
  {
    label: "Primary route",
    target: "Rabbit on-device broker",
    detail: "If the Mac fallback is unavailable or not needed, the Creation routes to the Rabbit broker on the device.",
  },
  {
    label: "Validation",
    target: "Expected output + blockers",
    detail: "Bridge shows dry-run output, missing inputs, likely blockers, and concise hints before approval.",
  },
  {
    label: "Assistant clients",
    target: "OpenClaw, Hermes, Claude, ChatGPT/Codex",
    detail: "Assistant gateways may suggest or structure requests; broker approval and execution stay with the active broker path.",
  },
];

const deviceModes = [
  {
    mode: "Normal reboot",
    expected: "Device returns to stock rabbitOS and clears current-boot temporary privilege.",
  },
  {
    mode: "Recovery",
    expected: "Broker guides recovery-mode entry and labels recovery mount options before any action.",
  },
  {
    mode: "Fastboot",
    expected: "Fastboot entry is allowed as a reboot mode; flashing remains blocked unless explicitly re-scoped later.",
  },
  {
    mode: "USB Storage Mode",
    expected: "Broker discovers whether rabbitOS, recovery, or MTK paths can expose allowed storage to the connected host.",
  },
];

const adbControls = [
  {
    label: "ADB over USB",
    detail: "Checks cable state, authorization state, and whether the system prompt can be surfaced for user approval.",
  },
  {
    label: "ADB over TCP/IP",
    detail: "Separates TCP/IP transport from USB authorization and records network reachability before queueing.",
  },
  {
    label: "System auth prompt",
    detail: "Requests the broker to surface or guide the Android allow-permission prompt when the live system supports it.",
  },
  {
    label: "Awareness broadcast",
    detail: "Publishes ADB USB/TCP/IP availability, discovery hints, and current transport blockers to the UI.",
  },
];

const offlineRecovery = [
  {
    label: "Audit lookup",
    detail: "Search active and archived JSONL records by request ID, action, broker, device state, artifact hash, or time.",
  },
  {
    label: "Rollback guide",
    detail: "Show last known pre-check, changed items, persistence expectation, recovery path, and verification step.",
  },
  {
    label: "Debug help",
    detail: "Keep offline explanations for ADB, reboot modes, storage exposure, queue states, and broker routing errors.",
  },
];

const auditReviewTargets = [
  {
    label: "Rabbit LLM",
    role: "on-device review",
    detail: "Summarize the audit context and suggest the next Rabbit-local action.",
  },
  {
    label: "Hermes",
    role: "handoff analysis",
    detail: "Compare broker results against the shared Rabbit handoff and flag unverifiable claims.",
  },
  {
    label: "OpenClaw",
    role: "federated memory",
    detail: "Correlate request history, gateway state, and durable Rabbit project memory.",
  },
  {
    label: "ChatGPT/Codex",
    role: "implementation review",
    detail: "Inspect request structure, expected output, blockers, tests, and next code changes.",
  },
  {
    label: "Rabbit intern",
    role: "guided assistant",
    detail: "Turn the audit record into concise next-step prompts for the user.",
  },
  {
    label: "DLAM",
    role: "multi-agent synthesis",
    detail: "Merge broker state, audit evidence, and assistant feedback into one expected outcome plan.",
  },
];

const pwaCapabilities = [
  {
    label: "Hosted UI",
    detail: "GitHub Pages serves the Superuser Management app and QR entry point.",
  },
  {
    label: "Offline cache",
    detail: "Service worker caches the UI, broker manifests, prompt guides, templates, and recovery docs.",
  },
  {
    label: "Broker API client",
    detail: "The PWA can call Rabbit or Mac broker endpoints when the browser runtime can reach them.",
  },
  {
    label: "No browser root",
    detail: "Privileged work is represented as broker requests; the PWA never claims direct root execution.",
  },
];

const serviceControls = [
  "status",
  "start_bridge",
  "restart_bridge",
  "stop_bridge",
  "start_on_device_broker",
  "restart_on_device_broker",
  "stop_on_device_broker",
  "clear_previous_broker_configurations",
  "refresh_routes",
];

const skillUploadFormats = [
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
];

const skillUploaderStages = [
  "Upload",
  "Parse",
  "Normalize",
  "Dry run",
  "Approve hook",
  "Audit",
];

const readinessAssets = [
  "creation-skill/manifest.json",
  "creation-skill/creation-launcher.json",
  "creation-skill/broker-service-guide.md",
  "creation-skill/custom-skill-uploader.md",
  "broker/rabbit-native-broker-spec.json",
  "broker/gateway-topology.json",
  "broker/release-gate.json",
  "broker/prompt-library.json",
  "broker/request-templates/custom-skill-upload-request.json",
  "broker/request-templates/broker-service-control-request.json",
];

const readinessSteps = [
  "PWA loaded",
  "Launcher ready",
  "Offline cache",
  "Bridge route",
  "Service control",
  "Skill upload",
];

const enablementWizardSteps = [
  {
    title: "Open Creation",
    action: "Run First Run / Readiness Check.",
    expect: "Launcher files, guides, templates, and cache support are visible.",
    blocker: "Missing launcher, guide, template, service worker, or Cache API support.",
  },
  {
    title: "Detect Route",
    action: "Tap Detect broker bridge and read the route target.",
    expect: "Route is Mac fallback or Rabbit on-device broker with blockers shown.",
    blocker: "Unknown route target or execution claim without audit evidence.",
  },
  {
    title: "Check Services",
    action: "Run Service Control status, then refresh_routes.",
    expect: "Bridge and broker status are returned with dry-run audit evidence.",
    blocker: "Service claims start, stop, restart, or privilege without broker approval.",
  },
  {
    title: "Prepare SU",
    action: "Select Temporary SU Bootstrap and fill required variables.",
    expect: "Dry-run request shows privilegedExecutionPerformed=false.",
    blocker: "Missing request variables or no dry-run result.",
  },
  {
    title: "Approve Gate",
    action: "Confirm current device state, broker identity, rollback note, and explicit approval.",
    expect: "Broker records approval for one allowlisted current-boot action.",
    blocker: "Persistent change, OTA risk, slot change, flash, erase, or bypassed approval.",
  },
  {
    title: "Use And Audit",
    action: "Run one allowlisted action, then inspect the audit result.",
    expect: "Audit records request, route, decision, result, changed items, and rollback clues.",
    blocker: "Device restarted, missing audit ID, or unknown result.",
  },
  {
    title: "Disable Or Recover",
    action: "Reboot to clear temporary state and search audit/rollback help.",
    expect: "Temporary access is cleared on restart and logs explain next checks.",
    blocker: "No matching audit evidence; label unknown instead of guessing.",
  },
];

const superuserActionPlan = [
  {
    step: "Import",
    action: "Scan skill QR",
    outcome: "Rabbit opens the Superuser Management Creation with GitHub-hosted configuration.",
  },
  {
    step: "Pair",
    action: "Reconnect from QR",
    outcome: "The Creation loads lease metadata through the Rabbit connector or fallback QR.",
  },
  {
    step: "Choose",
    action: "Pick workflow",
    outcome: "Prompts explain inputs, risk, required checks, and the broker that can handle it.",
  },
  {
    step: "Prepare",
    action: "Fill request",
    outcome: "A dry-run JSON request is generated with missing values called out before queueing.",
  },
  {
    step: "Authorize",
    action: "Approve live",
    outcome: "Privileged work stays gated by explicit approval and current device state.",
  },
  {
    step: "Verify",
    action: "Read audit",
    outcome: "Results, blocked actions, and rollback clues are searchable in active and archived logs.",
  },
];

const gatewayTopology = [
  {
    name: "Creation UI",
    role: "touch interface",
    detail: "Starts guided requests and shows approvals, hints, results, and logs.",
  },
  {
    name: "Rabbit bridge",
    role: "local handoff",
    detail: "Connects the Creation UI to the on-device broker API when available.",
  },
  {
    name: "Rabbit on-device broker",
    role: "primary executor",
    detail: "Validates requests locally and owns current-boot actions after bootstrap.",
  },
  {
    name: "Rabbit gateway connector",
    role: "retrieval path",
    detail: "Loads GitHub-hosted manifests, prompts, templates, and lease pairing data.",
  },
  {
    name: "OpenClaw gateway",
    role: "federation and admin",
    detail: "Shares Rabbit memory, handoff state, and remote admin context without owning device execution.",
  },
  {
    name: "Hermes gateway",
    role: "assistant bridge",
    detail: "Can consume the same handoff and gateway state when available; unverified claims stay labeled.",
  },
  {
    name: "Mac local broker",
    role: "fallback bootstrap",
    detail: "Coordinates lab bootstrap and lease files when the MacBook is online.",
  },
  {
    name: "GitHub storage",
    role: "shared state",
    detail: "Stores queue files, manifests, prompt packs, QR targets, and audit archives.",
  },
];

const responsePlaybook = [
  {
    outcome: "Import the tool",
    firstStep: "Scan Creation skill QR",
    expectedResponse: "Creation opens with Superuser Management, gateway mesh, prompts, and queue paths loaded.",
    nextAction: "Verify manifest, then pair lease metadata.",
    stopIf: "Manifest or gateway topology cannot load.",
  },
  {
    outcome: "Pair brokers",
    firstStep: "Reconnect from QR",
    expectedResponse: "Rabbit connector reads broker/lease-pairing.json and reports ownership metadata.",
    nextAction: "Refresh or renew lease if Mac fallback is the current owner.",
    stopIf: "Pairing file is missing, stale, or not connector-readable.",
  },
  {
    outcome: "Start a safe request",
    firstStep: "Pick workflow",
    expectedResponse: "Prompt guide maps the outcome to a request template and highlights required values.",
    nextAction: "Fill request_id, device_state, broker_id, route_target, lease_holder, and approval_decision.",
    stopIf: "Required variables are missing.",
  },
  {
    outcome: "Check an elevated action",
    firstStep: "Run dry run",
    expectedResponse: "Broker returns queued, blocked, yielded, or missing-live-check without changing the device.",
    nextAction: "Only continue if the broker shows eligible route, live checks, and explicit approval.",
    stopIf: "Broker claims execution without an audit record.",
  },
  {
    outcome: "Use current-boot SU",
    firstStep: "Approve live",
    expectedResponse: "After validated bootstrap, Rabbit-native broker may handle allowed current-boot actions until restart.",
    nextAction: "Execute only allowlisted action classes and record audit ID.",
    stopIf: "Device restarted, broker is not validated, or action would persist by default.",
  },
  {
    outcome: "Debug or roll back",
    firstStep: "Read audit",
    expectedResponse: "Active and archived logs show request, decision, result, changed items, rollback clues, and offline help.",
    nextAction: "Search by request ID, artifact hash, broker ID, action, or time.",
    stopIf: "No matching audit evidence exists.",
  },
];

const executionChecklist = [
  {
    item: "Hosted manifest",
    requiredFor: "Import, safe request",
    dependency: "manifest, sync, topology, walkthrough",
    evidence: "HTTP 200 + valid JSON",
    blocker: "No route or guide order",
  },
  {
    item: "Gateway topology",
    requiredFor: "Pair, dry run, SU approval",
    dependency: "Rabbit bridge, Rabbit broker, gateways",
    evidence: "Each gateway role is listed",
    blocker: "Unknown response owner",
  },
  {
    item: "Lease pairing",
    requiredFor: "Pair, request, dry run",
    dependency: "lease-pairing + coordination",
    evidence: "72-hour policy + SU unaffected",
    blocker: "Ambiguous result writer",
  },
  {
    item: "Request template",
    requiredFor: "Request, dry run, approval",
    dependency: "template + required variables + route target",
    evidence: "Template validates, route is selected, no missing variables",
    blocker: "No allowlisted action",
  },
  {
    item: "Dry-run result",
    requiredFor: "Live approval",
    dependency: "queued/blocked response + audit",
    evidence: "No device change",
    blocker: "Blind approval",
  },
  {
    item: "Live device gate",
    requiredFor: "Current-boot SU",
    dependency: "approval, fresh state, executor",
    evidence: "Current broker and device identity",
    blocker: "No elevated action",
  },
  {
    item: "Audit lookup",
    requiredFor: "Debug, rollback",
    dependency: "active log + archive index + offline debug guide",
    evidence: "Searchable request, artifact, route, and rollback clue",
    blocker: "Unknown result or missing offline evidence",
  },
];

const promptGuides: PromptGuide[] = [
  {
    id: "guided-request-start",
    title: "Start Guided Broker Request",
    category: "Walkthrough",
    risk: "Low",
    action: "open_prompt_library",
    templatePath: "broker/prompt-library.json",
    summary: "Chooses the right workflow, broker, and template before a request starts.",
    does: [
      "Asks what outcome the user wants.",
      "Maps the outcome to a request template.",
      "Explains risk, required checks, and broker routing.",
    ],
    variables: [
      {
        name: "request_id",
        label: "Request ID",
        required: true,
        source: "Generated when the request starts.",
        meaning: "Connects UI state, broker actions, approvals, and audit records.",
        placeholder: "req-20260815-guided-001",
      },
      {
        name: "device_state",
        label: "Device state",
        required: true,
        source: "User selection or broker live check.",
        meaning: "Prevents the broker from applying a workflow to the wrong boot mode.",
        placeholder: "normal boot, USB connected",
      },
      {
        name: "template_path",
        label: "Template path",
        required: true,
        source: "Selected request template under broker/request-templates/.",
        meaning: "Names the allowlisted workflow and its risk policy.",
        placeholder: "broker/request-templates/normal-reboot-request.json",
      },
    ],
    prompt:
      "Create a guided broker request using {{template_path}} for {{device_state}}. Use request {{request_id}} and route it to the eligible broker.",
  },
  {
    id: "temporary-su-bootstrap",
    title: "Temporary SU Bootstrap",
    category: "Privilege",
    risk: "High",
    action: "request_temporary_privilege_session",
    templatePath: "broker/request-templates/temporary-privilege-dry-run.json",
    summary: "Prepares restart-scoped privilege through Mac fallback, then Rabbit broker use.",
    does: [
      "Confirms the temporary state is restart-scoped.",
      "Requires live authorization after device restart.",
      "Records that reboot clears the temporary state.",
    ],
    variables: [
      {
        name: "request_id",
        label: "Request ID",
        required: true,
        source: "Generated by the Creation or broker.",
        meaning: "Ties the bootstrap request to later audit records.",
        placeholder: "req-20260815-su-001",
      },
      {
        name: "device_state",
        label: "Device state",
        required: true,
        source: "Confirmed after device restart.",
        meaning: "Shows the broker the R1 is in the expected startup state.",
        placeholder: "fresh normal boot after restart",
      },
      {
        name: "lease_holder",
        label: "Lease holder",
        required: true,
        source: "Read from broker-coordination.json activeLease.",
        meaning: "Identifies which broker may write execution results.",
        placeholder: "mac-local-fallback",
      },
      {
        name: "approval_decision",
        label: "Approval decision",
        required: true,
        source: "Explicit user approval or dry-run selection.",
        meaning: "Prevents silent escalation and records intent.",
        placeholder: "dry-run only",
      },
      {
        name: "rollback_note",
        label: "Rollback note",
        required: false,
        source: "User or broker summary before approval.",
        meaning: "Explains how reboot or inspection recovers state.",
        placeholder: "Reboot clears temporary state; inspect audit before retry.",
      },
    ],
    prompt:
      "Prepare restart-scoped temporary SU request {{request_id}} for {{device_state}}. Active lease is {{lease_holder}}. Continue only after {{approval_decision}} and include rollback note: {{rollback_note}}.",
  },
  {
    id: "usb-storage-discovery",
    title: "USB Storage Discovery",
    category: "Storage",
    risk: "High",
    action: "prepare_usb_mass_storage_request",
    templatePath: "broker/request-templates/usb-mass-storage-request.json",
    summary: "Finds supported exposure mode before assuming mass storage is available.",
    does: [
      "Checks Android file transfer, recovery mount options, and read-only export options.",
      "Explains what another computer should see over USB.",
      "Provides next-step guidance for mount errors.",
    ],
    variables: [
      {
        name: "request_id",
        label: "Request ID",
        required: true,
        source: "Generated when the storage request starts.",
        meaning: "Tracks discovery steps and any mount guidance.",
        placeholder: "req-20260815-storage-001",
      },
      {
        name: "broker_id",
        label: "Broker ID",
        required: true,
        source: "Read from /health, /state, or broker coordination.",
        meaning: "Shows whether Rabbit primary or Mac fallback is guiding the workflow.",
        placeholder: "rabbit-native or mac-local-fallback",
      },
      {
        name: "device_state",
        label: "Device state",
        required: true,
        source: "User selection and broker live check.",
        meaning: "Identifies current boot mode and USB connection state.",
        placeholder: "normal boot, connected to Mac by USB",
      },
      {
        name: "rollback_note",
        label: "Rollback note",
        required: false,
        source: "Mount failure, disconnect, or recovery guidance.",
        meaning: "Keeps troubleshooting steps attached to the request.",
        placeholder: "If not visible on host, try file transfer or recovery mount check.",
      },
    ],
    prompt:
      "Guide USB storage discovery for {{request_id}} on {{device_state}} through {{broker_id}}. Show recovery notes: {{rollback_note}}.",
  },
  {
    id: "adb-mode-preflight",
    title: "ADB Mode Preflight",
    category: "Developer Tools",
    risk: "High",
    action: "prepare_adb_enable_request",
    templatePath: "broker/request-templates/adb-enable-request.json",
    summary: "Checks ADB USB or TCP/IP readiness before a broker queues the workflow.",
    does: [
      "Separates ADB over USB from ADB over TCP/IP.",
      "Checks whether the request is dry-run or live execution.",
      "Warns when Creation or APK context cannot authorize ADB alone.",
    ],
    variables: [
      {
        name: "request_id",
        label: "Request ID",
        required: true,
        source: "Generated when the ADB preflight starts.",
        meaning: "Tracks the requested ADB mode and approval result.",
        placeholder: "req-20260815-adb-001",
      },
      {
        name: "device_state",
        label: "Device state",
        required: true,
        source: "Broker live check or user-confirmed connection state.",
        meaning: "Confirms the R1 is in the expected USB or network state.",
        placeholder: "normal boot, USB connected",
      },
      {
        name: "template_path",
        label: "Template path",
        required: true,
        source: "ADB USB or TCP/IP request template.",
        meaning: "Selects the allowlisted ADB workflow.",
        placeholder: "broker/request-templates/adb-tcpip-request.json",
      },
      {
        name: "lease_holder",
        label: "Lease holder",
        required: true,
        source: "Read from broker-coordination.json activeLease.",
        meaning: "Shows which broker may write the result.",
        placeholder: "mac-local-fallback",
      },
      {
        name: "approval_decision",
        label: "Approval decision",
        required: true,
        source: "Explicit user selection.",
        meaning: "Records whether ADB remains dry-run or can proceed later.",
        placeholder: "dry-run only",
      },
    ],
    prompt:
      "Run ADB preflight for {{request_id}} using {{template_path}}. Device state is {{device_state}}. Active lease holder is {{lease_holder}}. Approval decision is {{approval_decision}}.",
  },
  {
    id: "audit-lookup",
    title: "Audit Lookup and Rollback Clues",
    category: "Debugging",
    risk: "Low",
    action: "open_prompt_library",
    templatePath: "broker/audit-manifest.json",
    summary: "Searches active and archived broker logs to explain what changed.",
    does: [
      "Looks up requests by ID, broker, artifact hash, or time.",
      "Summarizes approval, dry-run, execution, and rollback records.",
      "Points to the next debug question when evidence is missing.",
    ],
    variables: [
      {
        name: "request_id",
        label: "Request ID",
        required: true,
        source: "Audit record, UI request preview, or broker response.",
        meaning: "Finds the exact request thread across active and archived logs.",
        placeholder: "req-20260815-su-001",
      },
      {
        name: "broker_id",
        label: "Broker ID",
        required: false,
        source: "Read from the audit record or broker health response.",
        meaning: "Narrows the search to Rabbit primary or Mac fallback activity.",
        placeholder: "mac-local-fallback",
      },
      {
        name: "artifact_sha256",
        label: "Artifact SHA-256",
        required: false,
        source: "Computed for a file, APK, prompt pack, or method reference.",
        meaning: "Finds records tied to a specific artifact.",
        placeholder: "optional sha256",
      },
      {
        name: "rollback_note",
        label: "Rollback note",
        required: false,
        source: "Audit record or user note.",
        meaning: "Keeps recovery context visible while debugging.",
        placeholder: "Use latest post-check before retry.",
      },
    ],
    prompt:
      "Search active and archived audit logs for {{request_id}}, broker {{broker_id}}, and artifact {{artifact_sha256}}. Summarize what changed and use rollback note {{rollback_note}} if present.",
  },
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

const defaultBrokerEndpoint = "http://100.80.216.88:8792";
const defaultIMessageEndpoint = "https://michaels-macbook-pro.tailcfaeac.ts.net:10000";
const defaultHermesEndpoint = "https://michaels-macbook-pro.tailcfaeac.ts.net:8443";

function initialCreationId() {
  if (typeof window === "undefined") {
    return "A1BrokerTestV2";
  }
  return new URLSearchParams(window.location.search).get("creation") || "A1BrokerTestV2";
}

function initialBrokerEndpoint() {
  if (typeof window === "undefined") {
    return defaultBrokerEndpoint;
  }
  return new URLSearchParams(window.location.search).get("broker") || defaultBrokerEndpoint;
}

function initialIMessageEndpoint() {
  if (typeof window === "undefined") {
    return defaultIMessageEndpoint;
  }
  return new URLSearchParams(window.location.search).get("imessage") || defaultIMessageEndpoint;
}

function initialHermesEndpoint() {
  if (typeof window === "undefined") {
    return defaultHermesEndpoint;
  }
  return new URLSearchParams(window.location.search).get("hermes") || defaultHermesEndpoint;
}

function initialRelayToken() {
  if (typeof window === "undefined") {
    return "";
  }
  return new URLSearchParams(window.location.search).get("relay_token") || "";
}

function ExpandablePreview({ title, summary, value }: ExpandablePreviewProps) {
  return (
    <details className="expandBox">
      <summary>
        <span>{title}</span>
        <strong>{summary}</strong>
      </summary>
      <pre className="requestPreview">{value}</pre>
    </details>
  );
}

function StatusReadout({ label, value, details }: StatusReadoutProps) {
  return (
    <div className="simpleStatus">
      <strong>{label}</strong>
      <span>{value}</span>
      {details ? (
        <details className="simpleDetails">
          <summary>Full output</summary>
          <pre>{details}</pre>
        </details>
      ) : null}
    </div>
  );
}

export default function Home() {
  const [creationId] = useState(initialCreationId);
  const [view, setView] = useState<"folders" | "list">("folders");
  const [sortMode, setSortMode] = useState<SortMode>("category");
  const [selectedCategory, setSelectedCategory] = useState("Media Tools");
  const [query, setQuery] = useState("");
  const [removing, setRemoving] = useState<Creation | null>(null);
  const [editTarget, setEditTarget] = useState<Creation | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [promptDetailsOpen, setPromptDetailsOpen] = useState(false);
  const [selectedPromptId, setSelectedPromptId] = useState(promptGuides[0].id);
  const [promptValues, setPromptValues] = useState<Record<string, string>>({
    request_id: "req-draft-001",
    approval_decision: "dry-run only",
  });
  const [queueStatus, setQueueStatus] = useState("Not queued");
  const [leaseActionStatus, setLeaseActionStatus] = useState("Lease manager idle");
  const [auditHandoffStatus, setAuditHandoffStatus] = useState("No audit handoff exported");
  const [brokerEndpoint, setBrokerEndpoint] = useState(initialBrokerEndpoint);
  const [iMessageEndpoint] = useState(initialIMessageEndpoint);
  const [hermesEndpoint] = useState(initialHermesEndpoint);
  const [relayToken, setRelayToken] = useState(initialRelayToken);
  const [bridgeProbeStatus, setBridgeProbeStatus] = useState("Bridge not checked");
  const [bridgeRoutePreview, setBridgeRoutePreview] = useState("No route selected");
  const [serviceControlStatus, setServiceControlStatus] = useState("No service-control request sent");
  const [serviceControlPreview, setServiceControlPreview] = useState("Service state not checked");
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState("Approval dialog not checked");
  const [approvalPreview, setApprovalPreview] = useState<ApprovalPreview | null>(null);
  const [gatewayRelayStatus, setGatewayRelayStatus] = useState("Gateway relay not checked");
  const [gatewayRelayPreview, setGatewayRelayPreview] = useState("Use this before another QR. It checks OpenClaw/Hermes relay readiness, HTTPS, auth, broker forwarding, and stop conditions.");
  const [skillUploadStatus, setSkillUploadStatus] = useState("No skill file loaded");
  const [skillUploadPreview, setSkillUploadPreview] = useState("Upload .txt, .csv, .md, .json, .yaml, .pdf, or .zip skill files.");
  const [readinessStatus, setReadinessStatus] = useState("First-run check not started");
  const [readinessPreview, setReadinessPreview] = useState("Run readiness before relying on offline cache or broker routing.");
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardChecks, setWizardChecks] = useState<Record<string, boolean>>({});
  const [publishUrl, setPublishUrl] = useState(
    "https://beaudown.github.io/rabbit-custom-creations-ui/",
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const visible = creations.filter((creation) => {
      return (
        creation.name.toLowerCase().includes(normalized) ||
        creation.category.toLowerCase().includes(normalized) ||
        creation.description.toLowerCase().includes(normalized)
      );
    });

    return [...visible].sort((a, b) => {
      if (sortMode === "newest") {
        return b.installedAt.localeCompare(a.installedAt);
      }
      if (sortMode === "oldest") {
        return a.installedAt.localeCompare(b.installedAt);
      }
      if (sortMode === "name") {
        return a.name.localeCompare(b.name);
      }
      return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
    });
  }, [query, sortMode]);

  const folders = categories.map((category) => ({
    name: category,
    count: creations.filter((creation) => creation.category === category).length,
  }));

  const selectedCreations = filtered.filter(
    (creation) => creation.category === selectedCategory || view === "list",
  );
  const selectedPrompt =
    promptGuides.find((prompt) => prompt.id === selectedPromptId) ?? promptGuides[0];
  const missingVariables = selectedPrompt.variables.filter((variable) => {
    return variable.required && !promptValues[variable.name]?.trim();
  });
  const renderedPrompt = selectedPrompt.variables.reduce((text, variable) => {
    const value = promptValues[variable.name]?.trim() || `{{${variable.name}}}`;
    return text.replaceAll(`{{${variable.name}}}`, value);
  }, selectedPrompt.prompt);
  const composedRequest = {
    schemaVersion: 1,
    requestId: promptValues.request_id?.trim() || "req-draft-missing-id",
    createdAt: "draft",
    source: {
      kind: "rabbit_creation",
      label: "Rabbit Custom Creations UI",
    },
    promptId: selectedPrompt.id,
    action: selectedPrompt.action,
    risk: selectedPrompt.risk.toLowerCase(),
    requiresApproval: selectedPrompt.risk === "High",
    requiresLiveDeviceCheck: selectedPrompt.risk === "High",
    dryRun: true,
    templatePath: selectedPrompt.templatePath,
    variables: Object.fromEntries(
      selectedPrompt.variables.map((variable) => [
        variable.name,
        promptValues[variable.name]?.trim() || "",
      ]),
    ),
    renderedPrompt,
    missingRequiredVariables: missingVariables.map((variable) => variable.name),
  };
  const requestPreview = JSON.stringify(composedRequest, null, 2);

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=14&data=${encodeURIComponent(
    publishUrl,
  )}`;
  const skillUrl = `${publishUrl.replace(/\/$/, "")}/creation-skill/manifest.json`;
  const skillQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=14&data=${encodeURIComponent(
    skillUrl,
  )}`;
  const leasePairingUrl = `${publishUrl.replace(/\/$/, "")}/broker/lease-pairing.json`;
  const leasePairingQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=14&data=${encodeURIComponent(
    leasePairingUrl,
  )}`;
  const currentWizardStep = enablementWizardSteps[wizardStep];
  const wizardRequest = {
    schemaVersion: 1,
    requestId: "wizard-temporary-su-dry-run",
    action: "request_temporary_privilege_session",
    dryRun: true,
    routeTargetKnown: Boolean(wizardChecks.routeTargetKnown),
    readinessComplete: Boolean(wizardChecks.readinessComplete),
    serviceStatusChecked: Boolean(wizardChecks.serviceStatusChecked),
    requiredVariablesFilled: Boolean(wizardChecks.requiredVariablesFilled),
    approvalReady: Boolean(wizardChecks.approvalReady),
    auditReady: Boolean(wizardChecks.auditReady),
    blockersReviewed: Boolean(wizardChecks.blockersReviewed),
    expectedScope: "current_boot_cycle_ram_only_until_restart",
    persistenceExpected: false,
  };
  const iMessageGatewayContract = {
    schemaVersion: 1,
    purpose: "Creation session iMessage bridge contract for MacBook mirroring and Hermes-verified Rabbit replies.",
    connectionMode: "hermes_secured_verification",
    prefilledConnection: {
      hermesVerifierEndpoint: hermesEndpoint,
      iMessageBrokerEndpoint: iMessageEndpoint,
      rabbitGatewayEndpoint: brokerEndpoint,
    },
    endpoint: hermesEndpoint,
    directBrokerEndpointForHermesOnly: iMessageEndpoint,
    auth: {
      requiredForRead: true,
      requiredForSend: true,
      mode: "hermes_verifies_and_injects_local_broker_token",
      rabbitShouldSendBrokerToken: false,
      creationStoresBrokerToken: false,
      brokerHeaderInjectedByHermes: "x-imessage-broker-token",
      tokenSource: "Mac-local token file, read only by Hermes",
      doNotPrintTokenInCreationOutput: true,
    },
    hermesVerification: {
      required: true,
      verifyCaller: true,
      sanitizeResponse: true,
      tokenHandling: "Hermes reads the local token file and injects the broker auth header server-side.",
      allowedBrokerRoutes: [
        "GET /imessage/health",
        "GET /imessage/messages",
        "GET /imessage/threads",
        "POST /imessage/send",
        "POST /imessage/hermes-response",
      ],
    },
    getNewMessages: {
      method: "GET",
      hermesVerifiedUrl: `${hermesEndpoint.replace(/\/$/, "")}/imessage/messages?since=<nextCursor>&limit=25`,
      hermesForwardsTo: `${iMessageEndpoint.replace(/\/$/, "")}/imessage/messages?since=<nextCursor>&limit=25`,
      headers: {
        "x-hermes-verify": "imessage.read",
      },
      returns: ["messages", "nextCursor", "hasMore"],
    },
    getRecentThreads: {
      method: "GET",
      hermesVerifiedUrl: `${hermesEndpoint.replace(/\/$/, "")}/imessage/threads?threadLimit=15&perDirection=25`,
      hermesForwardsTo: `${iMessageEndpoint.replace(/\/$/, "")}/imessage/threads?threadLimit=15&perDirection=25`,
      headers: {
        "x-hermes-verify": "imessage.read",
      },
      returns: ["threads[].received[0..24]", "threads[].sent[0..24]"],
    },
    postReply: {
      method: "POST",
      hermesVerifiedUrl: `${hermesEndpoint.replace(/\/$/, "")}/imessage/send`,
      hermesForwardsTo: `${iMessageEndpoint.replace(/\/$/, "")}/imessage/send`,
      headers: {
        "content-type": "application/json",
        "x-hermes-verify": "imessage.send",
      },
      body: {
        requestId: "reply-001",
        to: "+15555550100",
        text: "Reply message text",
        attachments: [],
      },
    },
    hermesReplyAlias: `${hermesEndpoint.replace(/\/$/, "")}/imessage/hermes-response`,
    macMessagesSendEnabled: true,
  };

  function updatePromptValue(name: string, value: string) {
    setPromptValues((current) => ({ ...current, [name]: value }));
  }

  function setWizardCheck(name: string, checked: boolean) {
    setWizardChecks((current) => ({ ...current, [name]: checked }));
  }

  function brokerFetch(path: string, init: RequestInit = {}) {
    const baseUrl = brokerEndpoint.replace(/\/$/, "");
    const headers = new Headers(init.headers);
    if (relayToken.trim()) {
      headers.set("x-rabbit-relay-token", relayToken.trim());
    }
    return fetch(`${baseUrl}${path}`, {
      ...init,
      headers,
    });
  }

  function relayAuthGuidance() {
    return {
      likelyCause: "Relay token is missing, expired, or typed incorrectly.",
      fix: "Enter the relay token in the Start Here token field, then rerun Step 1 and Step 2 only.",
      tokenSource: "Mac only: /private/tmp/rabbit-https-relay-token.txt",
      tokenSafety: "Do not paste the token into chat, GitHub, QR codes, screenshots, shared memory, or transcripts.",
      privilegedExecutionPerformed: false,
    };
  }

  function unwrapBrokerResponse(body: Record<string, unknown>) {
    return body.status === "forwarded" && body.response && typeof body.response === "object"
      ? (body.response as Record<string, unknown>)
      : body;
  }

  async function queueToMacBroker() {
    if (missingVariables.length) {
      setQueueStatus(`Missing required values: ${missingVariables.map((item) => item.name).join(", ")}`);
      return;
    }

    setQueueStatus("Queueing to Mac broker...");
    try {
      const response = await brokerFetch("/requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: requestPreview,
      });
      const body = await response.json();
      setQueueStatus(
        response.ok
          ? `Queued: ${body.queued?.queuePath ?? body.audit?.id ?? body.status}`
          : `Broker rejected: ${body.status ?? response.status}`,
      );
    } catch {
      setQueueStatus(`Mac broker unavailable at ${brokerEndpoint}`);
    }
  }

  async function detectBrokerBridge() {
    const baseUrl = brokerEndpoint.replace(/\/$/, "");
    setBridgeProbeStatus("Checking broker bridge...");
    try {
      const [healthResponse, routeResponse, adbResponse] = await Promise.all([
        brokerFetch("/health"),
        brokerFetch("/bridge/route"),
        brokerFetch("/adb/status"),
      ]);
      const endpointStatuses = [
        { label: "health", ok: healthResponse.ok, status: healthResponse.status },
        { label: "bridgeRoute", ok: routeResponse.ok, status: routeResponse.status },
        { label: "adbStatus", ok: adbResponse.ok, status: adbResponse.status },
      ];
      if (!healthResponse.ok || !routeResponse.ok || !adbResponse.ok) {
        const failed = endpointStatuses.filter((endpoint) => !endpoint.ok);
        const relayAuthRequired = failed.some((endpoint) => endpoint.status === 401);
        setBridgeProbeStatus(
          relayAuthRequired
            ? "Relay token required or incorrect. Re-enter token, then rerun Step 1 and Step 2."
            : "Broker bridge reachable, but one safe endpoint failed",
        );
        setBridgeRoutePreview(
          JSON.stringify(
            {
              status: relayAuthRequired ? "relay_auth_required" : "partial",
              brokerEndpoint: baseUrl,
              relayAuthRequired,
              endpointStatuses,
              failedEndpoints: failed,
              relayAuth: relayAuthRequired ? relayAuthGuidance() : undefined,
              nextStep:
                relayAuthRequired
                  ? "Enter the relay token in Start Here. Run Step 1 and Step 2 again only. Do not continue to service, approval, ADB, root, reboot, install, or cleanup."
                  : "Stop after Step 2 and report this full output. Do not continue to service, approval, ADB, root, reboot, install, or cleanup.",
              privilegedExecutionPerformed: false,
            },
            null,
            2,
          ),
        );
        return;
      }
      const healthEnvelope = await healthResponse.json();
      const routeEnvelope = await routeResponse.json();
      const adbEnvelope = await adbResponse.json();
      const health = unwrapBrokerResponse(healthEnvelope);
      const route = unwrapBrokerResponse(routeEnvelope);
      const adb = unwrapBrokerResponse(adbEnvelope);
      const routeTarget =
        typeof route.routeTarget === "string" ? route.routeTarget : "route target not returned";
      const privilegedExecutionEnabled = Boolean(health.privilegedExecutionEnabled);
      const adbStatus = adb.adb && typeof adb.adb === "object"
        ? (adb.adb as Record<string, { status?: string }>)
        : {};
      setBridgeProbeStatus(
        `${typeof health.role === "string" ? health.role : "broker"} online; selected ${routeTarget}; privileged execution ${privilegedExecutionEnabled ? "enabled" : "disabled"}`,
      );
      setBridgeRoutePreview(
        JSON.stringify(
          {
            routeTarget,
            expectedOutput: route.expectedOutput,
            blockers: route.blockers,
            adbUsb: adbStatus.usb?.status,
            adbTcpip: adbStatus.tcpip?.status,
            relayForwarded: routeEnvelope.status === "forwarded",
          },
          null,
          2,
        ),
      );
    } catch {
      setBridgeProbeStatus("Broker unreachable. Stop here.");
      setBridgeRoutePreview(
        JSON.stringify(
          {
            status: "blocked",
            brokerEndpoint: baseUrl,
            sameBlockerFor: ["service status", "approval dialog", "gateway relay"],
            likelyCause: "Rabbit cannot reach the Mac broker endpoint from this Creation.",
            nextStep: "Do not keep pressing later buttons. We need an HTTPS OpenClaw/Hermes relay or Rabbit-native broker route first.",
          },
          null,
          2,
        ),
      );
    }
  }

  async function requestServiceControl(serviceAction: string) {
    const baseUrl = brokerEndpoint.replace(/\/$/, "");
    setServiceControlStatus(`Requesting ${serviceAction}...`);
    try {
      const response = await brokerFetch("/broker/service", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          schemaVersion: 1,
          requestId: `service-${serviceAction}`,
          serviceAction,
          source: "superuser_management_creation",
          dryRun: true,
        }),
      });
      const body = await response.json();
      setServiceControlStatus(
        `${body.status ?? response.status}: ${body.audit?.id ?? body.serviceAction ?? serviceAction}`,
      );
      setServiceControlPreview(
        JSON.stringify(
          {
            serviceAction: body.serviceAction,
            expectedOutput: body.expectedOutput,
            blockers: body.blockers,
            bridge: body.serviceStatus?.serviceControl?.bridge,
            rabbitBroker: body.serviceStatus?.serviceControl?.rabbitOnDeviceBroker,
            privilegedExecutionPerformed: body.privilegedExecutionPerformed,
          },
          null,
          2,
        ),
      );
    } catch {
      setServiceControlStatus("Blocked: broker unreachable");
      setServiceControlPreview(
        JSON.stringify(
          {
            status: "blocked",
            brokerEndpoint: baseUrl,
            reason: "Service status uses the same broker route as Detect route.",
            nextStep: "Stop testing service/approval/gateway until the broker route is reachable.",
            deviceActionPerformed: false,
          },
          null,
          2,
        ),
      );
    }
  }

  async function openBrokerApprovalDialog() {
    setApprovalStatus("Opening broker approval dialog...");
    setApprovalDialogOpen(true);
    setApprovalPreview({
      status: "checking",
      stopReason: "Waiting for broker action review.",
      warnings: ["Do not approve root, ADB, reboot, install, fastboot, recovery, or shell until the broker returns an audit ID."],
      blockers: [],
      github: {
        queue: "broker/queue/inbox",
        audit: "broker/audit-log.jsonl",
        coordination: "broker/broker-coordination.json",
      },
    });

    try {
      const response = await brokerFetch("/actions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          schemaVersion: 1,
          requestId: `rabbit-approval-temporary-superuser-${Date.now()}`,
          action: "temporary_superuser",
          execute: true,
          explicitApproval: false,
          liveDeviceVerified: false,
          exactBuildValidated: false,
          persistentChangeAllowed: false,
          deviceActionAllowed: false,
          source: "superuser_management_creation_approval_dialog",
          githubStorage: {
            auditLog: "broker/audit-log.jsonl",
            queueInbox: "broker/queue/inbox",
            coordination: "broker/broker-coordination.json",
          },
        }),
      });
      const body = await response.json();
      const review = body.review ?? {};
      setApprovalStatus(`${body.status ?? response.status}: ${body.audit?.id ?? review.stopReason ?? "reviewed"}`);
      setApprovalPreview({
        status: body.status ?? response.status,
        action: review.label ?? review.action ?? "Temporary superuser",
        risk: review.risk ?? "critical",
        stopReason: review.stopReason ?? "No stop reason returned.",
        expectedOutcome: review.expectedOutcome ?? "Broker did not return an expected outcome.",
        warnings: review.warnings ?? [],
        blockers: review.blockers ?? [],
        checks: review.checks ?? {},
        auditId: body.audit?.id ?? "none",
        queued: body.queued?.queuePath ?? "not queued",
        github: {
          queue: body.queued?.queuePath ?? "broker/queue/inbox",
          audit: "broker/audit-log.jsonl",
          coordination: "broker/broker-coordination.json",
        },
        execution: {
          privilegedExecutionPerformed: body.privilegedExecutionPerformed,
          persistentChange: body.persistentChange,
          otaBreakingChange: body.otaBreakingChange,
        },
      });
    } catch {
      setApprovalStatus("Blocked: broker unreachable");
      setApprovalPreview({
        status: "offline",
        action: "Temporary superuser",
        risk: "critical",
        stopReason: "Broker approval endpoint uses the same unreachable broker route.",
        expectedOutcome: "Stop here until an HTTPS OpenClaw/Hermes relay or Rabbit-native broker route exists.",
        warnings: ["Do not continue with any device-affecting action while approval state is unknown."],
        blockers: ["Broker endpoint unreachable."],
        auditId: "none",
        queued: "not queued",
        github: {
          queue: "broker/queue/inbox",
          audit: "broker/audit-log.jsonl",
          coordination: "broker/broker-coordination.json",
        },
      });
    }
  }

  async function probeGatewayRelay() {
    const baseUrl = brokerEndpoint.replace(/\/$/, "");
    setGatewayRelayStatus("Checking OpenClaw/Hermes relay path...");
    try {
      const response = await brokerFetch("/gateway/relay/probe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          schemaVersion: 1,
          source: "superuser_management_creation_gateway_relay_probe",
          callerOrigin: typeof window !== "undefined" ? window.location.origin : "unknown",
          brokerEndpoint: baseUrl,
          requestedMode: "dry_run_probe_only",
          authenticated: false,
        }),
      });
      const body = await response.json();
      setGatewayRelayStatus(`${body.status ?? response.status}: ${body.audit?.id ?? "no audit"}`);
      setGatewayRelayPreview(
        JSON.stringify(
          {
            relayCandidate: body.relayCandidate,
            openclaw: body.gateways?.openclaw,
            hermes: body.gateways?.hermes,
            failurePoints: body.failurePoints,
            stopConditions: body.stopConditions,
            nextImplementationStep: body.nextImplementationStep,
            privilegedExecutionPerformed: body.privilegedExecutionPerformed,
          },
          null,
          2,
        ),
      );
    } catch {
      setGatewayRelayStatus("Blocked: broker unreachable");
      setGatewayRelayPreview(
        JSON.stringify(
          {
            status: "blocked",
            brokerEndpoint: baseUrl,
            likelyBlockers: [
              "Rabbit cannot reach the current broker route.",
              "The OpenClaw/Hermes relay endpoint is not installed yet.",
              "A hosted HTTPS Creation should use an HTTPS relay, not a Mac-only HTTP route.",
            ],
            nextStep: "Create the HTTPS OpenClaw/Hermes relay tool before another QR test.",
            privilegedExecutionPerformed: false,
          },
          null,
          2,
        ),
      );
    }
  }

  async function runCreationReadinessCheck() {
    const baseBrokerUrl = brokerEndpoint.replace(/\/$/, "");
    setReadinessStatus("Checking Creation readiness...");

    const assetResults = await Promise.all(
      readinessAssets.map(async (asset) => {
        try {
          const response = await fetch(asset, { cache: "no-store" });
          return {
            asset,
            ok: response.ok,
            status: response.status,
          };
        } catch {
          return {
            asset,
            ok: false,
            status: "unreachable",
          };
        }
      }),
    );

    const serviceWorkerReady = "serviceWorker" in navigator;
    const cacheApiReady = "caches" in window;
    const controlledByServiceWorker = Boolean(navigator.serviceWorker?.controller);

    const endpointResults = await Promise.all(
      [
        { label: "health", path: "/health", requiredForRoute: true },
        { label: "bridgeRoute", path: "/bridge/route", requiredForRoute: true },
        { label: "serviceControl", path: "/broker/service", requiredForRoute: false },
        { label: "adbStatus", path: "/adb/status", requiredForRoute: false },
        { label: "gatewayRelay", path: "/gateway/relay/probe", requiredForRoute: false },
      ].map(async ({ label, path, requiredForRoute }) => {
        try {
          const response = await brokerFetch(path);
          return {
            label,
            ok: response.ok,
            status: response.status,
            requiredForRoute,
          };
        } catch {
          return {
            label,
            ok: false,
            status: "unreachable",
            requiredForRoute,
          };
        }
      }),
    );

    const requiredAssetsReady = assetResults.every((result) => result.ok);
    const coreBrokerReachable = endpointResults
      .filter((result) => result.requiredForRoute)
      .every((result) => result.ok);
    const endpointsReady = endpointResults.every((result) => result.ok);
    const failedOptionalEndpoints = endpointResults.filter(
      (result) => !result.requiredForRoute && !result.ok,
    );
    const relayAuthRequired = endpointResults.some((result) => result.status === 401);
    const offlineReady = serviceWorkerReady && cacheApiReady;
    const summary = {
      schemaVersion: 1,
      status:
        requiredAssetsReady && offlineReady && endpointsReady
          ? "ready_for_single_creation_use"
          : requiredAssetsReady && offlineReady && relayAuthRequired
            ? "assets_ready_relay_auth_required"
          : requiredAssetsReady && offlineReady && coreBrokerReachable
            ? "assets_ready_core_broker_reachable_optional_failed"
          : requiredAssetsReady && offlineReady
            ? "assets_ready_broker_unreachable"
            : "partial",
      requiredAssetsReady,
      offlineReady,
      serviceWorkerReady,
      cacheApiReady,
      controlledByServiceWorker,
      brokerEndpoint: baseBrokerUrl,
      coreBrokerReachable,
      endpointsReady,
      relayAuthRequired,
      relayAuth: relayAuthRequired ? relayAuthGuidance() : undefined,
      assetResults,
      endpointResults,
      failedOptionalEndpoints,
      nextSteps: [
        controlledByServiceWorker
          ? "Offline cache is controlled by a service worker."
          : "Reload once after first online load so the service worker can control the page.",
        relayAuthRequired
          ? "Relay auth failed. Enter the relay token in Start Here, then rerun Step 1 and Step 2 only."
          : coreBrokerReachable
          ? "Core broker route is reachable. Continue to Step 2 only."
          : "Stop after setup. Route, service, approval, and gateway all need a reachable broker endpoint.",
        endpointResults.some((result) => result.label === "gatewayRelay" && result.ok)
          ? "Gateway relay probe is available."
          : "Gateway relay is optional at Step 1. Do not continue past Step 2 until route output is reviewed.",
        "Keep service-control and skill-hook actions as broker-approved dry runs until live authorization exists.",
      ],
    };

    setReadinessStatus(
      relayAuthRequired
        ? `${summary.status}: assets ${requiredAssetsReady ? "ready" : "partial"}, relay token required`
        : `${summary.status}: assets ${requiredAssetsReady ? "ready" : "partial"}, core broker ${coreBrokerReachable ? "reachable" : "unreachable"}`,
    );
    setReadinessPreview(JSON.stringify(summary, null, 2));
  }

  async function parseSkillUpload(file: File | null) {
    if (!file) {
      return;
    }

    const extension = `.${file.name.split(".").pop()?.toLowerCase() || ""}`;
    const textReadable = [".txt", ".md", ".csv", ".json", ".yaml", ".yml", ".toml", ".xml"].includes(extension);
    const uploadSummary = {
      schemaVersion: 1,
      requestId: `skill-upload-${file.name.replaceAll(/[^A-Za-z0-9._-]+/g, "-").slice(0, 64)}`,
      action: "prepare_custom_skill_upload_request",
      file: {
        name: file.name,
        type: file.type || "unknown",
        size: file.size,
        extension,
        textReadable,
      },
      parsePlan: textReadable
        ? "Read text, extract title/headings/fields, normalize into skill metadata, and queue dry run."
        : "Record binary package metadata, hash externally before publish, and require broker-side parser.",
      hookPolicy: {
        mayUseAfterSuperuserEnabled: true,
        automaticSystemHooking: false,
        requiresBrokerApproval: true,
        requiresAuditRecord: true,
      },
    };

    if (textReadable) {
      const content = await file.text();
      const lines = content.split(/\r?\n/);
      Object.assign(uploadSummary, {
        textSample: lines.slice(0, 8).join("\n").slice(0, 1200),
        lineCount: lines.length,
        detectedHeadings: lines
          .filter((line) => /^#{1,6}\s+/.test(line) || /^[A-Za-z0-9 _-]+:$/.test(line))
          .slice(0, 8),
      });
    }

    setSkillUploadStatus(`Parsed ${file.name}; dry-run import ready`);
    setSkillUploadPreview(JSON.stringify(uploadSummary, null, 2));
  }

  async function queueSkillUpload() {
    const baseUrl = brokerEndpoint.replace(/\/$/, "");
    setSkillUploadStatus("Queueing skill upload dry run...");
    try {
      const request = JSON.parse(skillUploadPreview);
      const response = await brokerFetch("/skills/upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(request),
      });
      const body = await response.json();
      setSkillUploadStatus(
        `${body.status ?? response.status}: ${body.audit?.id ?? body.fileName ?? "skill upload"}`,
      );
      setSkillUploadPreview(JSON.stringify(body, null, 2));
    } catch {
      setSkillUploadStatus(`No skill upload endpoint reachable at ${baseUrl}`);
    }
  }

  async function runLeaseAction(action: "refresh" | "renew" | "release" | "reconnect") {
    const endpoint =
      action === "reconnect" ? "pairing" : action;
    const method = action === "reconnect" ? "GET" : "POST";
    const path =
      endpoint === "pairing" ? "/lease/pairing" : `/lease/${endpoint}`;

    setLeaseActionStatus(`${action} in progress...`);
    try {
      const response = await fetch(`http://127.0.0.1:8792${path}`, {
        method,
        headers: method === "POST" ? { "content-type": "application/json" } : undefined,
        body:
          method === "POST"
            ? JSON.stringify({ reason: `ui lease ${action}` })
            : undefined,
      });
      const body = await response.json();
      const marker =
        body.audit?.id ||
        body.current?.activeLease?.holder ||
        body.status ||
        body.current?.brokerId ||
        "ok";
      setLeaseActionStatus(
        `${action} complete: ${marker}; SU unaffected`,
      );
    } catch {
      setLeaseActionStatus(`Mac broker unavailable for ${action}`);
    }
  }

  function downloadSyncExport() {
    const syncExport = {
      schemaVersion: 1,
      createdAt: new Date().toISOString(),
      source: "rabbit-custom-creations-ui",
      syncManifest: "broker/sync-manifest.json",
      queueInbox: "broker/queue/inbox",
      request: composedRequest,
      requestStates,
    };
    const blob = new Blob([`${JSON.stringify(syncExport, null, 2)}\n`], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${composedRequest.requestId || "broker-request"}-sync-export.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function downloadAuditHandoff(target: string) {
    const auditHandoff = {
      schemaVersion: 1,
      createdAt: new Date().toISOString(),
      source: "rabbit-custom-creations-ui",
      target,
      purpose: "review_audit_and_suggest_next_expected_outcome",
      auditManifest: "broker/audit-manifest.json",
      activeLog: "broker/audit-log.jsonl",
      archiveDir: "broker/archive",
      searchableFields: [
        "request_id",
        "action",
        "broker_id",
        "route_target",
        "device_state",
        "artifact_sha256",
        "created_at",
        "rollback_note",
      ],
      latestRecords: auditRecords,
      composedRequest,
      instructions: [
        "Use audit evidence first.",
        "Separate confirmed facts from missing evidence.",
        "Suggest dry-run or rollback-safe next steps before live action.",
        "Do not claim privileged execution unless the broker result proves it.",
      ],
    };
    const blob = new Blob([`${JSON.stringify(auditHandoff, null, 2)}\n`], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const safeTarget = target.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-handoff-${safeTarget || "review"}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setAuditHandoffStatus(`Audit handoff exported for ${target}`);
  }

  const isIMessageBrokerCreation = creationId === "iMessageHermesBroker";

  if (isIMessageBrokerCreation) {
    return (
      <main className="shell">
        <section className="device">
          <section className="rabbitStart" aria-label="Hermes iMessage broker setup">
            <p className="eyebrow">Hermes Verified</p>
            <h1>iMessage Broker</h1>
            <p>
              Use this Creation for message fetch and reply routing only.
              Hermes verifies the request and injects the Mac-local broker token.
            </p>
            <StatusReadout label="Hermes Secure URL" value={hermesEndpoint} />
            <StatusReadout label="iMessage Broker URL" value={iMessageEndpoint} />
            <StatusReadout label="Rabbit Gateway URL" value={brokerEndpoint} />
            <StatusReadout
              label="GET messages"
              value={`${hermesEndpoint.replace(/\/$/, "")}/imessage/messages?since=<nextCursor>&limit=25`}
              details={JSON.stringify(iMessageGatewayContract.getNewMessages, null, 2)}
            />
            <StatusReadout
              label="GET threads"
              value={`${hermesEndpoint.replace(/\/$/, "")}/imessage/threads?threadLimit=15&perDirection=25`}
              details={JSON.stringify(iMessageGatewayContract.getRecentThreads, null, 2)}
            />
            <StatusReadout
              label="POST reply"
              value={`${hermesEndpoint.replace(/\/$/, "")}/imessage/send`}
              details={JSON.stringify(iMessageGatewayContract.postReply, null, 2)}
            />
            <StatusReadout
              label="Connection"
              value="Prefilled for Hermes verification. No broker token is stored in this Creation"
              details={JSON.stringify(iMessageGatewayContract, null, 2)}
            />
            <p className="plainWarning">
              Direct broker token handling stays on the Mac and is not shown in
              this Creation.
            </p>
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="shell">
      <section className="device">
        <section className="rabbitStart" aria-label="Simple Rabbit setup">
          <p className="eyebrow">Start Here</p>
          <h1>Superuser Management</h1>
          <p>
            Use only this box for now. These checks do not run root, ADB,
            reboot, install, fastboot, recovery, or broker start actions.
          </p>
          <StatusReadout label="Broker URL" value={brokerEndpoint} />
          <StatusReadout label="Hermes Secure URL" value={hermesEndpoint} />
          <StatusReadout label="Tailnet iMessage URL" value={iMessageEndpoint} />
          <label className="simpleField">
            <span>Relay token</span>
            <input
              value={relayToken}
              onChange={(event) => setRelayToken(event.target.value)}
              placeholder="required if output says 401"
              type="password"
            />
            <small>401 means this token is missing or wrong. The token stays local and is never printed here.</small>
          </label>
          <div className="simpleActions" aria-label="Safe setup checks">
            <button className="primaryStartButton" onClick={runCreationReadinessCheck}>
              1 Check setup
            </button>
            <button className="primaryStartButton" onClick={detectBrokerBridge}>
              2 Detect route
            </button>
            <button
              className="primaryStartButton"
              onClick={() => requestServiceControl("status")}
            >
              3 Service status
            </button>
            <button className="primaryStartButton approvalButton" onClick={openBrokerApprovalDialog}>
              4 Approval dialog
            </button>
            <button className="primaryStartButton gatewayButton" onClick={probeGatewayRelay}>
              5 Gateway relay
            </button>
          </div>
          <StatusReadout label="Setup" value={readinessStatus} details={readinessPreview} />
          <StatusReadout label="Route" value={bridgeProbeStatus} details={bridgeRoutePreview} />
          <StatusReadout label="Service" value={serviceControlStatus} details={serviceControlPreview} />
          <StatusReadout
            label="Approval"
            value={approvalStatus}
            details={approvalPreview ? JSON.stringify(approvalPreview, null, 2) : undefined}
          />
          <StatusReadout label="Gateway" value={gatewayRelayStatus} details={gatewayRelayPreview} />
          <StatusReadout
            label="iMessage API"
            value="Prefilled for Hermes verification. Hermes injects x-imessage-broker-token from the Mac token file"
            details={JSON.stringify(iMessageGatewayContract, null, 2)}
          />
          <p className="plainWarning">
            Use button 5 before a new QR. It shows relay blockers without running device actions.
          </p>
        </section>

        <header className="topbar" aria-label="Creation manager controls">
          <div>
            <p className="eyebrow">Rabbit R1</p>
            <h1>Creations</h1>
          </div>
          <button
            className="iconButton"
            aria-label="Open settings"
            onClick={() => setSettingsOpen(true)}
          >
            SET
          </button>
        </header>

        <div className="searchRow">
          <label className="search">
            <span>Search</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Find creation"
            />
          </label>
          <button className="addButton">Add</button>
        </div>

        <div className="segmented" aria-label="View mode">
          <button
            className={view === "folders" ? "active" : ""}
            onClick={() => setView("folders")}
          >
            Folders
          </button>
          <button
            className={view === "list" ? "active" : ""}
            onClick={() => setView("list")}
          >
            All
          </button>
        </div>

        <label className="sortControl">
          <span>Sort</span>
          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as SortMode)}
          >
            <option value="category">Category folders</option>
            <option value="newest">Date installed: newest</option>
            <option value="oldest">Date installed: oldest</option>
            <option value="name">Name A-Z</option>
          </select>
        </label>

        {view === "folders" ? (
          <section className="folderGrid" aria-label="Creation folders">
            {folders.map((folder) => (
              <button
                key={folder.name}
                className={`folderCard ${
                  selectedCategory === folder.name ? "selected" : ""
                }`}
                onClick={() => setSelectedCategory(folder.name)}
              >
                <span className="folderTab" />
                <span className="folderTitle">{folder.name}</span>
                <span className="folderMeta">{folder.count} installed</span>
              </button>
            ))}
          </section>
        ) : null}

        <section className="contentHeader">
          <div>
            <p className="eyebrow">Current</p>
            <h2>{view === "folders" ? selectedCategory : "All Creations"}</h2>
          </div>
          <span>{selectedCreations.length}</span>
        </section>

        <section className="creationList" aria-label="Installed creations">
          {selectedCreations.length ? (
            selectedCreations.map((creation) => (
              <article className="creationCard" key={creation.id}>
                <div className={`mark ${creation.color}`}>
                  {creation.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="creationText">
                  <div className="creationTitle">
                    <h3>{creation.name}</h3>
                    <span>{creation.status}</span>
                  </div>
                  <p>{creation.description}</p>
                  <div className="metaLine">
                    <span>{creation.category}</span>
                    <span>v{creation.version}</span>
                    <span>{formatDate(creation.installedAt)}</span>
                  </div>
                </div>
                <div className="actions">
                  <button onClick={() => setEditTarget(creation)}>Move</button>
                  <button
                    className="danger"
                    onClick={() => setRemoving(creation)}
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="emptyState">
              <h3>No creations here</h3>
              <p>Add one or move an installed creation into this folder.</p>
            </div>
          )}
        </section>

        <section className="publishPanel" aria-label="GitHub Pages QR">
          <div>
            <p className="eyebrow">GitHub Pages</p>
            <h2>Scan to open</h2>
            <input
              value={publishUrl}
              onChange={(event) => setPublishUrl(event.target.value)}
              aria-label="Published GitHub Pages URL"
            />
          </div>
          <img src={qrUrl} alt="QR code for the hosted creations manager" />
        </section>

        <section className="publishPanel" aria-label="Creation skill import QR">
          <div>
            <p className="eyebrow">Import Skill</p>
            <h2>Creation workflow</h2>
            <input
              value={skillUrl}
              readOnly
              aria-label="Creation skill manifest URL"
            />
          </div>
          <img src={skillQrUrl} alt="QR code for the Creation skill manifest" />
        </section>

        <section className="workflowPanel" aria-label="Superuser Management guide">
          <div>
            <p className="eyebrow">Unified Tool</p>
            <h2>Superuser Management</h2>
          </div>
          <p className="panelNote">
            One Creation should manage superuser actions, prompts, requests,
            queue, lease, logs, and device workflows without leaving the tool.
          </p>
          <div className="stateRail">
            {brokerModules.map((module) => (
              <span key={module}>{module}</span>
            ))}
          </div>
          <div className="stepRail">
            {workflowSteps.map((step, index) => (
              <div className="stepPill" key={step}>
                <span>{index + 1}</span>
                <strong>{step}</strong>
              </div>
            ))}
          </div>
          <button className="wideButton">Start guided request</button>
        </section>

        <section className="pwaPanel" aria-label="Hosted PWA capabilities">
          <div className="promptHeader">
            <div>
              <p className="eyebrow">Hosted PWA</p>
              <h2>On-device management</h2>
            </div>
            <span>Installable</span>
          </div>
          <p>
            This app is the hosted Superuser Management surface. It can install
            as a PWA, cache broker guides offline, and call broker APIs when the
            Rabbit browser/runtime can reach them.
          </p>
          <div className="routeList">
            {pwaCapabilities.map((item) => (
              <article className="routeItem" key={item.label}>
                <span>{item.label}</span>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="pwaPanel" aria-label="Single Creation first-run readiness">
          <div className="promptHeader">
            <div>
              <p className="eyebrow">First Run</p>
              <h2>Readiness check</h2>
            </div>
            <span>One tap</span>
          </div>
          <p>
            Verify the single Custom Creation launcher, offline cache, broker
            route, service-control endpoint, and skill uploader endpoint before
            using the tool away from a reliable connection.
          </p>
          <div className="stateRail">
            {readinessSteps.map((step) => (
              <span key={step}>{step}</span>
            ))}
          </div>
          <button className="wideButton" onClick={runCreationReadinessCheck}>
            Run first-run check
          </button>
          <div className="queueStatus">{readinessStatus}</div>
          <ExpandablePreview title="Readiness details" summary="Tap to expand" value={readinessPreview} />
        </section>

        <section className="pwaPanel" aria-label="Temporary SU enablement wizard">
          <div className="promptHeader">
            <div>
              <p className="eyebrow">Enablement Wizard</p>
              <h2>Temporary SU</h2>
            </div>
            <span>
              {wizardStep + 1}/{enablementWizardSteps.length}
            </span>
          </div>
          <p>
            Walk through single-boot temporary permission setup without skipping
            dry run, route selection, service status, approval, or audit checks.
          </p>
          <div className="stepRail">
            <div className="stepPill">
              <span>{wizardStep + 1}</span>
              <strong>{currentWizardStep.title}</strong>
            </div>
          </div>
          <div className="playbookItem">
            <dl>
              <div>
                <dt>Action</dt>
                <dd>{currentWizardStep.action}</dd>
              </div>
              <div>
                <dt>Expect</dt>
                <dd>{currentWizardStep.expect}</dd>
              </div>
              <div>
                <dt>Stop If</dt>
                <dd>{currentWizardStep.blocker}</dd>
              </div>
            </dl>
          </div>
          <div className="toggleList" aria-label="Wizard checks">
            <label>
              <input
                type="checkbox"
                checked={Boolean(wizardChecks.readinessComplete)}
                onChange={(event) => setWizardCheck("readinessComplete", event.target.checked)}
              />
              Readiness complete
            </label>
            <label>
              <input
                type="checkbox"
                checked={Boolean(wizardChecks.routeTargetKnown)}
                onChange={(event) => setWizardCheck("routeTargetKnown", event.target.checked)}
              />
              Route target known
            </label>
            <label>
              <input
                type="checkbox"
                checked={Boolean(wizardChecks.serviceStatusChecked)}
                onChange={(event) => setWizardCheck("serviceStatusChecked", event.target.checked)}
              />
              Service status checked
            </label>
            <label>
              <input
                type="checkbox"
                checked={Boolean(wizardChecks.requiredVariablesFilled)}
                onChange={(event) => setWizardCheck("requiredVariablesFilled", event.target.checked)}
              />
              Request variables filled
            </label>
            <label>
              <input
                type="checkbox"
                checked={Boolean(wizardChecks.approvalReady)}
                onChange={(event) => setWizardCheck("approvalReady", event.target.checked)}
              />
              Approval gate ready
            </label>
            <label>
              <input
                type="checkbox"
                checked={Boolean(wizardChecks.auditReady)}
                onChange={(event) => setWizardCheck("auditReady", event.target.checked)}
              />
              Audit lookup ready
            </label>
            <label>
              <input
                type="checkbox"
                checked={Boolean(wizardChecks.blockersReviewed)}
                onChange={(event) => setWizardCheck("blockersReviewed", event.target.checked)}
              />
              Blockers reviewed
            </label>
          </div>
          <ExpandablePreview
            title="Wizard request"
            summary="Tap to expand"
            value={JSON.stringify(wizardRequest, null, 2)}
          />
          <div className="composerActions">
            <button
              onClick={() => setWizardStep((step) => Math.max(0, step - 1))}
            >
              Back
            </button>
            <button
              className="solid"
              onClick={() =>
                setWizardStep((step) =>
                  Math.min(enablementWizardSteps.length - 1, step + 1),
                )
              }
            >
              Next
            </button>
          </div>
        </section>

        <section className="actionPlanPanel" aria-label="Superuser step-by-step actions">
          <div className="promptHeader">
            <div>
              <p className="eyebrow">Step By Step</p>
              <h2>Actionable flow</h2>
            </div>
            <span>6 steps</span>
          </div>
          <p className="panelNote">
            Each row shows the next actionable item and the expected outcome
            before the broker queues anything.
          </p>
          <div className="actionPlanList">
            {superuserActionPlan.map((item, index) => (
              <article className="actionPlanItem" key={item.step}>
                <span>{index + 1}</span>
                <div>
                  <strong>{item.step}</strong>
                  <p>{item.outcome}</p>
                </div>
                <button>{item.action}</button>
              </article>
            ))}
          </div>
        </section>

        <section className="playbookPanel" aria-label="Expected response walkthrough">
          <div className="promptHeader">
            <div>
              <p className="eyebrow">Response Playbook</p>
              <h2>Do this first</h2>
            </div>
            <span>Outcome led</span>
          </div>
          <p className="panelNote">
            Pick the expected outcome, then follow the first step to Provoke a
            broker response, next action, and stop condition.
          </p>
          <div className="playbookList">
            {responsePlaybook.map((item) => (
              <article className="playbookItem" key={item.outcome}>
                <h3>{item.outcome}</h3>
                <dl>
                  <div>
                    <dt>First</dt>
                    <dd>{item.firstStep}</dd>
                  </div>
                  <div>
                    <dt>Expect</dt>
                    <dd>{item.expectedResponse}</dd>
                  </div>
                  <div>
                    <dt>Next</dt>
                    <dd>{item.nextAction}</dd>
                  </div>
                  <div>
                    <dt>Stop</dt>
                    <dd>{item.stopIf}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        <section className="checklistPanel" aria-label="Required execution checklist">
          <div className="promptHeader">
            <div>
              <p className="eyebrow">Required Gates</p>
              <h2>Dependency checklist</h2>
            </div>
            <span>7 gates</span>
          </div>
          <p className="panelNote">
            Verify dependencies, evidence, and blockers before advancing from
            import to dry run, approval, current-boot SU, or rollback.
          </p>
          <div className="checklistList">
            {executionChecklist.map((item) => (
              <article className="checklistItem" key={item.item}>
                <div className="checklistTitle">
                  <h3>{item.item}</h3>
                  <span>{item.requiredFor}</span>
                </div>
                <dl>
                  <div>
                    <dt>Needs</dt>
                    <dd>{item.dependency}</dd>
                  </div>
                  <div>
                    <dt>Evidence</dt>
                    <dd>{item.evidence}</dd>
                  </div>
                  <div>
                    <dt>Blocks</dt>
                    <dd>{item.blocker}</dd>
                  </div>
                </dl>
              </article>
            ))}
          </div>
        </section>

        <section className="promptPanel" aria-label="Broker prompt guide">
          <div className="promptHeader">
            <div>
              <p className="eyebrow">Prompt Guide</p>
              <h2>Suggested prompts</h2>
            </div>
            <span>5 total</span>
          </div>
          <p>
            Each prompt explains what it does, which variables it needs, where
            those values come from, and what they mean before the broker queues a
            request.
          </p>
          <div className="promptList">
            {promptGuides.map((prompt) => (
              <button
                className={`promptCard ${selectedPromptId === prompt.id ? "selected" : ""}`}
                key={prompt.title}
                onClick={() => setSelectedPromptId(prompt.id)}
              >
                <div className="promptTitle">
                  <h3>{prompt.title}</h3>
                  <span>{prompt.risk}</span>
                </div>
                <p>{prompt.summary}</p>
                <div className="variableList">
                  {prompt.variables.slice(0, 3).map((variable) => (
                    <div className="variableRow" key={variable.name}>
                      <strong>{variable.name}</strong>
                      <span>{variable.source}</span>
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>
          <section className="composerPanel" aria-label="Request Composer">
            <div className="promptTitle">
              <h3>Request Composer</h3>
              <span>{missingVariables.length ? "Missing" : "Ready"}</span>
            </div>
            <label className="composerSelect">
              <span>Prompt</span>
              <select
                value={selectedPromptId}
                onChange={(event) => setSelectedPromptId(event.target.value)}
              >
                {promptGuides.map((prompt) => (
                  <option key={prompt.id} value={prompt.id}>
                    {prompt.title}
                  </option>
                ))}
              </select>
            </label>
            <div className="doesList">
              {selectedPrompt.does.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
            <div className="composerFields">
              {selectedPrompt.variables.map((variable) => (
                <label className="composerField" key={variable.name}>
                  <span>
                    {variable.label}
                    {variable.required ? " *" : ""}
                  </span>
                  <input
                    value={promptValues[variable.name] ?? ""}
                    onChange={(event) => updatePromptValue(variable.name, event.target.value)}
                    placeholder={variable.placeholder}
                  />
                  <small>{variable.source}</small>
                  <small>{variable.meaning}</small>
                </label>
              ))}
            </div>
            <div className="missingStrip">
              {missingVariables.length
                ? `Missing required values: ${missingVariables.map((item) => item.name).join(", ")}`
                : "All required values are present."}
            </div>
            <ExpandablePreview title="Request JSON" summary="Tap to expand" value={requestPreview} />
            <div className="composerActions">
              <button onClick={() => setPromptDetailsOpen(true)}>View all prompt details</button>
              <button className="solid" onClick={queueToMacBroker}>
                Queue to Mac broker
              </button>
            </div>
            <div className="queueStatus">{queueStatus}</div>
          </section>
        </section>

        <section className="statusPanel" aria-label="Remote broker status">
          <div>
            <p className="eyebrow">Rabbit Broker</p>
            <h2>On-device target</h2>
          </div>
          <p>
            GitHub hosts shared state. The Rabbit broker is the always-with-device
            primary; the Mac broker is a fallback bootstrap authority when the
            MacBook is online.
          </p>
          <div className="statusGrid">
            {brokerStatus.map((item) => (
              <div className="statusTile" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="gatewayPanel" aria-label="Superuser gateway topology">
          <div className="promptHeader">
            <div>
              <p className="eyebrow">Gateway Mesh</p>
              <h2>Broker bridge stack</h2>
            </div>
            <span>Unified</span>
          </div>
          <p>
            Superuser Management includes the on-device broker, local bridge,
            Rabbit gateway connector, OpenClaw gateway, Hermes gateway, Mac
            fallback broker, and GitHub storage as one routed control surface.
          </p>
          <div className="gatewayList">
            {gatewayTopology.map((item) => (
              <article className="gatewayItem" key={item.name}>
                <div>
                  <strong>{item.name}</strong>
                  <span>{item.role}</span>
                </div>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bridgePanel" aria-label="OpenClaw Hermes relay readiness">
          <div className="promptHeader">
            <div>
              <p className="eyebrow">Gateway Relay</p>
              <h2>OpenClaw / Hermes</h2>
            </div>
            <span>Probe only</span>
          </div>
          <p>
            This checks whether a future OpenClaw or Hermes tool can front the
            broker through one authenticated relay. It does not expose tokens or
            run root, ADB, reboot, install, fastboot, recovery, shell, or flash.
          </p>
          <button className="wideButton" onClick={probeGatewayRelay}>
            Probe gateway relay
          </button>
          <div className="queueStatus">{gatewayRelayStatus}</div>
          <ExpandablePreview title="Relay details" summary="Tap to expand" value={gatewayRelayPreview} />
        </section>

        <section className="bridgePanel" aria-label="Bridge routing policy">
          <div className="promptHeader">
            <div>
              <p className="eyebrow">Bridge Routing</p>
              <h2>Broker selection</h2>
            </div>
            <span>Auto route</span>
          </div>
          <p>
            The bridge is routing and validation logic. It checks local Mac
            fallback reachability first, then routes to the Rabbit on-device
            broker when local fallback is unavailable or not needed.
          </p>
          <label className="composerField">
            <span>Broker endpoint</span>
            <input
              value={brokerEndpoint}
              onChange={(event) => setBrokerEndpoint(event.target.value)}
              placeholder="http://127.0.0.1:8792"
            />
            <small>Use the Mac fallback endpoint now; switch to the Rabbit broker endpoint when installed.</small>
          </label>
          <label className="composerField">
            <span>Relay token</span>
            <input
              value={relayToken}
              onChange={(event) => setRelayToken(event.target.value)}
              placeholder="testing relay token"
              type="password"
            />
            <small>Only for an authenticated HTTPS relay test. Leave blank for the local Mac broker.</small>
          </label>
          <button className="wideButton" onClick={detectBrokerBridge}>
            Detect broker bridge
          </button>
          <div className="queueStatus">{bridgeProbeStatus}</div>
          <ExpandablePreview title="Route details" summary="Tap to expand" value={bridgeRoutePreview} />
          <div className="routeList">
            {bridgeRoutes.map((item) => (
              <article className="routeItem" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.target}</strong>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="bridgePanel" aria-label="Broker service controls">
          <div className="promptHeader">
            <div>
              <p className="eyebrow">Service Control</p>
              <h2>Bridge startup</h2>
            </div>
            <span>Broker gated</span>
          </div>
          <p>
            The Creation can request bridge and broker start, stop, restart, and
            status actions. New broker starts also clear previous transient
            broker configuration before accepting requests. The active broker
            must decide, log, and verify the result.
          </p>
          <div className="rootGrid">
            {serviceControls.map((action) => (
              <button key={action} onClick={() => requestServiceControl(action)}>
                {action.replaceAll("_", " ")}
              </button>
            ))}
          </div>
          <div className="queueStatus">{serviceControlStatus}</div>
          <ExpandablePreview title="Service details" summary="Tap to expand" value={serviceControlPreview} />
        </section>

        <section className="bridgePanel" aria-label="Custom skill uploader">
          <div className="promptHeader">
            <div>
              <p className="eyebrow">Skill Uploader</p>
              <h2>Custom imports</h2>
            </div>
            <span>Dry run</span>
          </div>
          <p>
            Upload skill files into the single Superuser Management Creation.
            Text formats are parsed locally; package formats require broker-side
            inspection. System hooks wait for broker approval after temporary SU
            is available.
          </p>
          <label className="composerField">
            <span>Skill file</span>
            <input
              type="file"
              accept={skillUploadFormats.join(",")}
              onChange={(event) => parseSkillUpload(event.target.files?.[0] ?? null)}
            />
            <small>Supported: {skillUploadFormats.join(", ")}</small>
          </label>
          <div className="stateRail">
            {skillUploaderStages.map((stage) => (
              <span key={stage}>{stage}</span>
            ))}
          </div>
          <button className="wideButton" onClick={queueSkillUpload}>
            Queue skill upload dry run
          </button>
          <div className="queueStatus">{skillUploadStatus}</div>
          <ExpandablePreview title="Skill details" summary="Tap to expand" value={skillUploadPreview} />
        </section>

        <section className="publishPanel" aria-label="Lease pairing QR">
          <div>
            <p className="eyebrow">Lease Pairing</p>
            <h2>72-hour ownership</h2>
            <input
              value={leasePairingUrl}
              readOnly
              aria-label="Lease pairing manifest URL"
            />
            <p className="panelNote">
              Rabbit connector auto-retrieves this lease metadata when pairing
              broker ownership. SU remains current-boot local.
            </p>
          </div>
          <img src={leasePairingQrUrl} alt="QR code for broker lease pairing" />
        </section>

        <section className="leasePanel" aria-label="Superuser lease controls">
          <div className="promptHeader">
            <div>
              <p className="eyebrow">Superuser Management</p>
              <h2>Ownership controls</h2>
            </div>
            <span>SU safe</span>
          </div>
          <p>
            Refresh, renew, release, or reconnect pairing metadata for shared
            result-writing ownership. These actions do not affect Rabbit-local
            current-boot SU.
          </p>
          <div className="leaseGrid">
            {leaseManagerStats.map((item) => (
              <div className="leaseTile" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
          <div className="leaseActions">
            <button onClick={() => runLeaseAction("refresh")}>Refresh</button>
            <button onClick={() => runLeaseAction("renew")}>Renew</button>
            <button onClick={() => runLeaseAction("release")}>Release</button>
            <button onClick={() => runLeaseAction("reconnect")}>
              Reconnect from QR
            </button>
          </div>
          <div className="queueStatus">{leaseActionStatus}</div>
        </section>

        <section className="syncPanel" aria-label="GitHub sync contract">
          <div className="promptHeader">
            <div>
              <p className="eyebrow">GitHub Sync</p>
              <h2>Shared queue</h2>
            </div>
            <span>File based</span>
          </div>
          <p>
            Rabbit and Mac brokers read the same queue folders. GitHub stores
            requests and exports, but execution still belongs to the active
            broker lease holder. Rabbit-local SU remains current-boot scoped and
            is not gated by Mac reachability after bootstrap.
          </p>
          <div className="syncGrid">
            {syncPaths.map((item) => (
              <div className="syncTile" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
          <div className="stateRail">
            {requestStates.map((state) => (
              <span key={state}>{state}</span>
            ))}
          </div>
          <button className="wideButton" onClick={downloadSyncExport}>
            Download sync export
          </button>
        </section>

        <section className="rootPanel" aria-label="Superuser request shortcuts">
          <div>
            <p className="eyebrow">Superuser Actions</p>
            <h2>Common workflows</h2>
          </div>
          <p>
            Creation buttons call broker requests underneath the same
            Superuser Management tool. Execution waits for approval, live
            checks, and a temporary session gate.
          </p>
          <div className="brokerSplit">
            <span>Rabbit primary</span>
            <strong>native local executor target</strong>
            <span>Mac fallback</span>
            <strong>bootstrap only; Rabbit SU stays local</strong>
          </div>
          <div className="rootGrid">
            {rootRequestButtons.map((label) => (
              <button key={label}>{label}</button>
            ))}
          </div>
          <div className="helpStrip">
            USB Storage Mode is treated as a reboot/exposure workflow with
            guided mount help, mode discovery, external host checks, and
            fallback directions.
          </div>
        </section>

        <section className="modePanel" aria-label="Device reboot modes">
          <div className="promptHeader">
            <div>
              <p className="eyebrow">Device Modes</p>
              <h2>Reboot targets</h2>
            </div>
            <span>4 modes</span>
          </div>
          <p>
            Reboot, recovery, fastboot, and USB Storage Mode are exposed as
            guided mode changes. Each mode shows expected host-visible results
            before approval.
          </p>
          <div className="routeList">
            {deviceModes.map((item) => (
              <article className="routeItem" key={item.mode}>
                <span>{item.mode}</span>
                <p>{item.expected}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="adbPanel" aria-label="ADB USB and TCPIP controls">
          <div className="promptHeader">
            <div>
              <p className="eyebrow">ADB Control</p>
              <h2>USB + TCP/IP</h2>
            </div>
            <span>Prompt aware</span>
          </div>
          <p>
            ADB workflows track USB, TCP/IP, system authorization prompts, and
            transport awareness as first-class broker requests.
          </p>
          <div className="routeList">
            {adbControls.map((item) => (
              <article className="routeItem" key={item.label}>
                <span>{item.label}</span>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="offlinePanel" aria-label="Offline rollback and debug help">
          <div className="promptHeader">
            <div>
              <p className="eyebrow">Offline Recovery</p>
              <h2>Audit + rollback</h2>
            </div>
            <span>On device</span>
          </div>
          <p>
            The Creation should keep enough offline help to explain common
            failures even when GitHub, Mac fallback, or assistant gateways are
            unreachable.
          </p>
          <div className="routeList">
            {offlineRecovery.map((item) => (
              <article className="routeItem" key={item.label}>
                <span>{item.label}</span>
                <p>{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="auditPanel" aria-label="Broker audit log">
          <div className="auditSummary">
            <div>
              <p className="eyebrow">Broker Log</p>
              <h2>1,500 active records</h2>
            </div>
            <span>3 seed</span>
          </div>
          <p>
            Append-only GitHub JSONL log for requests, approvals, blocked
            actions, dry runs, execution results, rollback attempts, and
            post-checks.
          </p>
          <div className="auditStats">
            <span>Warn at 1,200</span>
            <span>Archive 500</span>
            <span>No secrets</span>
          </div>
          <div className="handoffList" aria-label="Audit review handoff targets">
            {auditReviewTargets.map((target) => (
              <article className="handoffItem" key={target.label}>
                <div>
                  <strong>{target.label}</strong>
                  <span>{target.role}</span>
                </div>
                <p>{target.detail}</p>
                <button onClick={() => downloadAuditHandoff(target.label)}>
                  Send review bundle
                </button>
              </article>
            ))}
          </div>
          <div className="queueStatus">{auditHandoffStatus}</div>
          <div className="auditList">
            {auditRecords.map((record) => (
              <article className="auditRecord" key={record.id}>
                <div>
                  <h3>{record.action}</h3>
                  <p>{record.detail}</p>
                </div>
                <div className="auditMeta">
                  <span>{record.status}</span>
                  <span>{record.time}</span>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>

      {removing ? (
        <div className="modalScrim" role="dialog" aria-modal="true">
          <div className="modal">
            <p className="eyebrow">Confirm uninstall</p>
            <h2>Remove {removing.name}?</h2>
            <p>
              This should uninstall the custom creation only after the device
              confirms the action. Keep this step explicit.
            </p>
            <div className="modalActions">
              <button onClick={() => setRemoving(null)}>Cancel</button>
              <button className="danger solid" onClick={() => setRemoving(null)}>
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editTarget ? (
        <div className="modalScrim" role="dialog" aria-modal="true">
          <div className="modal">
            <p className="eyebrow">Categorize</p>
            <h2>Move {editTarget.name}</h2>
            <div className="categoryChoices">
              {categories.slice(0, 8).map((category) => (
                <button key={category} onClick={() => setEditTarget(null)}>
                  {category}
                </button>
              ))}
            </div>
            <div className="modalActions">
              <button onClick={() => setEditTarget(null)}>Done</button>
            </div>
          </div>
        </div>
      ) : null}

      {settingsOpen ? (
        <div className="modalScrim" role="dialog" aria-modal="true">
          <div className="modal settingsModal">
            <p className="eyebrow">Creation Settings</p>
            <h2>Broker configuration</h2>
            <div className="settingsGrid">
              {brokerSettings.map((setting) => (
                <div className="settingTile" key={setting.label}>
                  <span>{setting.label}</span>
                  <strong>{setting.value}</strong>
                </div>
              ))}
            </div>
            <div className="toggleList" aria-label="Safety toggles">
              <label>
                <input type="checkbox" checked readOnly />
                Require approval
              </label>
              <label>
                <input type="checkbox" checked readOnly />
                Dry run first
              </label>
              <label>
                <input type="checkbox" checked readOnly />
                Hash artifacts
              </label>
              <label>
                <input type="checkbox" checked readOnly />
                Query archives
              </label>
            </div>
            <div className="modalActions">
              <button onClick={() => setSettingsOpen(false)}>Close</button>
              <button className="solid" onClick={() => setSettingsOpen(false)}>
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {approvalDialogOpen ? (
        <div className="modalScrim" role="dialog" aria-modal="true">
          <div className="modal approvalModal">
            <p className="eyebrow">Broker Approval</p>
            <h2>{approvalPreview?.action ?? "Temporary superuser"}</h2>
            <div className="approvalBanner">
              <strong>{approvalPreview?.status ?? "Unknown"}</strong>
              <span>{approvalPreview?.stopReason ?? "No broker response yet."}</span>
            </div>
            <div className="approvalGrid">
              <div>
                <span>Audit</span>
                <strong>{approvalPreview?.auditId ?? "none"}</strong>
              </div>
              <div>
                <span>Queue</span>
                <strong>{approvalPreview?.queued ?? "not queued"}</strong>
              </div>
              <div>
                <span>GitHub log</span>
                <strong>{approvalPreview?.github?.audit ?? "broker/audit-log.jsonl"}</strong>
              </div>
            </div>
            <section className="approvalSection">
              <h3>Warnings</h3>
              {(approvalPreview?.warnings?.length ? approvalPreview.warnings : ["No warnings returned."]).map((warning: string) => (
                <p key={warning}>{warning}</p>
              ))}
            </section>
            <section className="approvalSection">
              <h3>Blockers</h3>
              {(approvalPreview?.blockers?.length ? approvalPreview.blockers : ["No blockers returned."]).map((blocker: string) => (
                <p key={blocker}>{blocker}</p>
              ))}
            </section>
            <section className="approvalSection">
              <h3>Execution</h3>
              <p>{approvalPreview?.expectedOutcome ?? "Waiting for broker expected outcome."}</p>
              <p>
                Privileged: {String(approvalPreview?.execution?.privilegedExecutionPerformed ?? false)}
                {" "} Persistent: {String(approvalPreview?.execution?.persistentChange ?? false)}
                {" "} OTA break: {String(approvalPreview?.execution?.otaBreakingChange ?? false)}
              </p>
            </section>
            <div className="modalActions">
              <button onClick={() => setApprovalDialogOpen(false)}>Close</button>
              <button className="solid" onClick={openBrokerApprovalDialog}>
                Refresh
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {promptDetailsOpen ? (
        <div className="modalScrim" role="dialog" aria-modal="true">
          <div className="modal promptModal">
            <p className="eyebrow">Prompt Details</p>
            <h2>All broker prompts</h2>
            <div className="promptDetailList">
              {promptGuides.map((prompt) => (
                <article className="promptDetailCard" key={prompt.id}>
                  <div className="promptTitle">
                    <h3>{prompt.title}</h3>
                    <span>{prompt.risk}</span>
                  </div>
                  <p>{prompt.summary}</p>
                  <div className="variableList">
                    {prompt.variables.map((variable) => (
                      <div className="variableRow" key={variable.name}>
                        <strong>{variable.name}</strong>
                        <span>{variable.source}</span>
                        <span>{variable.meaning}</span>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
            <div className="modalActions">
              <button onClick={() => setPromptDetailsOpen(false)}>Close</button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
