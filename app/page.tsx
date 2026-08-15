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
  "Open Creation",
  "Load GitHub",
  "Dry Run",
  "Approve",
  "Execute",
  "Log Result",
];

const brokerSettings = [
  { label: "Active records", value: "1,500" },
  { label: "Warn at", value: "1,200" },
  { label: "Archive chunks", value: "500" },
  { label: "SU lifetime", value: "Until reboot" },
];

const brokerStatus = [
  { label: "GitHub UI", value: "Ready" },
  { label: "Request files", value: "Ready" },
  { label: "Rabbit broker", value: "Primary" },
  { label: "Mac broker", value: "Fallback" },
];

const rootRequestButtons = [
  "Temp SU",
  "ADB Enable",
  "Reboot",
  "Fastboot",
  "Recovery",
  "USB Storage",
  "APK Canary",
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

export default function Home() {
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

  function updatePromptValue(name: string, value: string) {
    setPromptValues((current) => ({ ...current, [name]: value }));
  }

  async function queueToMacBroker() {
    if (missingVariables.length) {
      setQueueStatus(`Missing required values: ${missingVariables.map((item) => item.name).join(", ")}`);
      return;
    }

    setQueueStatus("Queueing to Mac broker...");
    try {
      const response = await fetch("http://127.0.0.1:8792/requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: requestPreview,
      });
      const body = await response.json();
      setQueueStatus(
        response.ok ? `Queued: ${body.audit?.id ?? body.status}` : `Broker rejected: ${body.status ?? response.status}`,
      );
    } catch {
      setQueueStatus("Mac broker unavailable at 127.0.0.1:8792");
    }
  }

  return (
    <main className="shell">
      <section className="device">
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

        <section className="workflowPanel" aria-label="Broker workflow guide">
          <div>
            <p className="eyebrow">Skill Guide</p>
            <h2>Broker walkthrough</h2>
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
            <pre className="requestPreview">{requestPreview}</pre>
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

        <section className="rootPanel" aria-label="Broker root request shortcuts">
          <div>
            <p className="eyebrow">Broker Calls</p>
            <h2>Root workflows</h2>
          </div>
          <p>
            Creation buttons call broker requests. Execution waits for approval,
            live checks, and a temporary session gate.
          </p>
          <div className="brokerSplit">
            <span>Rabbit primary</span>
            <strong>native local executor target</strong>
            <span>Mac fallback</span>
            <strong>restart-scoped SU bootstrap</strong>
          </div>
          <div className="rootGrid">
            {rootRequestButtons.map((label) => (
              <button key={label}>{label}</button>
            ))}
          </div>
          <div className="helpStrip">
            USB Storage includes guided mount help, mode discovery, external
            host checks, and fallback directions.
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
