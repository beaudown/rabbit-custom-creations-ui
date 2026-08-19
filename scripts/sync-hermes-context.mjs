import fs from 'node:fs';
import { execSync } from 'node:child_process';

const now = new Date();
const isoNow = now.toISOString();
const displayNow = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Los_Angeles',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
  timeZoneName: 'short',
})
  .format(now)
  .replace(',', '');

const paths = {
  hermesContext: '/Users/z3k3z/.hermes/memories/RABBIT-CURRENT-CONTEXT.md',
  hermesMemory: '/Users/z3k3z/.hermes/memories/MEMORY.md',
  hermesSnapshot: '/Users/z3k3z/.hermes/memories/FEDERATED-SESSION-SNAPSHOT.md',
  hermesRecord: '/Users/z3k3z/Documents/AgentSharedMemory/hermes/memory.json',
  sourceOfTruth: '/Users/z3k3z/Documents/AgentSharedMemory/shared/SOURCE-OF-TRUTH.md',
  sessionIndex: '/Users/z3k3z/Documents/AgentSharedMemory/shared/session-index.json',
  codexInbox: '/Users/z3k3z/Documents/AgentSharedMemory/shared/inbox/codex-chatgpt.md',
};

function currentGitCommit() {
  try {
    return execSync('git -C "/Users/z3k3z/Documents/Omi Dev Space/rabbit-custom-creations-ui" log -1 --oneline', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return 'current main version';
  }
}

const latestHandoffCommit = currentGitCommit();
const routeStateCommit = 'b91bee7 Record HTTPS relay test state';

const currentContext = `# Rabbit Current Context - Hermes Fast Path

Updated: ${displayNow}

Purpose: compact first-read context for Hermes so Rabbit work starts from the current verified state without loading the full federation unless needed.

## Read This First

1. This file: \`${paths.hermesContext}\`
2. If project details are needed: \`/Users/z3k3z/Documents/Omi Dev Space/rabbit-custom-creations-ui/docs/HERMES-HANDOFF.md\`
3. If there is any conflict: \`/Users/z3k3z/Documents/AgentSharedMemory/shared/SOURCE-OF-TRUTH.md\`, then \`shared/session-index.json\`
4. Only for deeper history: \`/Users/z3k3z/.hermes/memories/FEDERATED-MEMORY.md\`

## Current Workstream

Rabbit Superuser Management hosted PWA and single Custom Creation package.

- Repo: \`https://github.com/beaudown/rabbit-custom-creations-ui\`
- Local repo: \`/Users/z3k3z/Documents/Omi Dev Space/rabbit-custom-creations-ui\`
- GitHub Pages: \`https://beaudown.github.io/rabbit-custom-creations-ui/\`
- QR launch sheet: \`https://beaudown.github.io/rabbit-custom-creations-ui/qr-launch-sheet.html\`
- Latest pushed handoff/sync commit: \`${latestHandoffCommit}\`
- Route-state evidence commit: \`${routeStateCommit}\`

## Current Route State

- HTTPS relay test route: \`https://michaels-macbook-pro.tailcfaeac.ts.net\`
- Relay forwards allowlisted calls to the Mac broker at \`http://100.80.216.88:8792\` through local relay \`127.0.0.1:8794\`.
- Release QR is still blocked.
- Rabbit external reachability is unverified until the user completes the Rabbit-side test.
- Relay token path: \`/private/tmp/rabbit-https-relay-token.txt\`
- Do not store the relay token value in GitHub, QR codes, shared memory, screenshots, or chat logs.

## Next Safe Action

User-operated Rabbit testing only:

1. Scan the testing QR.
2. Confirm Broker endpoint is \`https://michaels-macbook-pro.tailcfaeac.ts.net\`.
3. Enter the relay token manually from the local token file.
4. Run Step 1 and Step 2 only.
5. Stop and report exact Step 2 output.

## Hard Stops

Do not run Rabbit device commands, ADB, fastboot, recovery, reboot, install, WebUSB/WebSerial, DA/Preloader, flashing, root/SU, on-device broker install, OpenClaw auth changes, Hermes lifecycle changes, or privileged execution unless the user gives separate explicit live authorization and current safety gates are rechecked.

## Efficiency Rule For Hermes

Use this file for the current answer path. Load the full federation only when resolving conflicts, checking older decisions, verifying checksums, or preparing a formal handoff. Prefer concise status plus exact next action over broad history scans.
`;

function writeFile(path, contents) {
  fs.writeFileSync(path, contents, { mode: 0o600 });
}

writeFile(paths.hermesContext, currentContext);
writeFile(
  paths.hermesSnapshot,
  currentContext.replace(
    '# Rabbit Current Context - Hermes Fast Path',
    '# Federated Session Snapshot - Rabbit Current Context',
  ),
);

let hermesMemory = fs.readFileSync(paths.hermesMemory, 'utf8');
if (!hermesMemory.includes('## Rabbit Current Context Fast Path')) {
  hermesMemory = hermesMemory.replace(
    'Project focus:',
    `## Rabbit Current Context Fast Path

For Rabbit R1, Rabbit Superuser Management PWA, broker, OpenClaw, Hermes, or deployment-status work, read this compact current context first:
\`${paths.hermesContext}\`.

Only load the full federation or older handoffs if there is a conflict, missing detail, or a request for history. The relay token value must never be stored in memory, GitHub, QR codes, screenshots, or chat logs.

Project focus:`,
  );
}
hermesMemory = hermesMemory.replace(
  'current handoff commit `a18c191`',
  `current handoff/sync commit \`${latestHandoffCommit}\`; route-state evidence commit \`b91bee7\`; older commits \`388f027\`, \`10a5099\`, and \`a18c191\` are superseded`,
);
hermesMemory = hermesMemory.replace(
  'current handoff commit `10a5099`; route-state evidence commit `b91bee7`; older commit `a18c191` is superseded',
  `current handoff/sync commit \`${latestHandoffCommit}\`; route-state evidence commit \`b91bee7\`; older commits \`388f027\`, \`10a5099\`, and \`a18c191\` are superseded`,
);
hermesMemory = hermesMemory.replace(
  /current handoff\/sync commit `[^`]+`; route-state evidence commit `b91bee7`; older commits `388f027`, `10a5099`, and `a18c191` are superseded/g,
  `current handoff/sync commit \`${latestHandoffCommit}\`; route-state evidence commit \`b91bee7\`; older commits \`388f027\`, \`10a5099\`, and \`a18c191\` are superseded`,
);
hermesMemory = hermesMemory.replace(
  /current handoff\/sync commit `[^`]+`; route-state evidence commit `b91bee7`; older commits `10a5099` and `a18c191` are superseded/g,
  `current handoff/sync commit \`${latestHandoffCommit}\`; route-state evidence commit \`b91bee7\`; older commits \`388f027\`, \`10a5099\`, and \`a18c191\` are superseded`,
);
hermesMemory = hermesMemory.replace(
  'Latest repo handoff commit: 10a5099. Route-state evidence commit: b91bee7.',
  `Latest repo handoff/sync commit: ${latestHandoffCommit}. Route-state evidence commit: b91bee7.`,
);
hermesMemory = hermesMemory.replace(
  /Latest repo handoff\/sync commit: [^.]+\. Route-state evidence commit: b91bee7\./g,
  `Latest repo handoff/sync commit: ${latestHandoffCommit}. Route-state evidence commit: b91bee7.`,
);
hermesMemory = hermesMemory.replace(
  'Safe host-side implementation is complete; next task is live acceptance facilitation only.',
  'Safe host-side implementation is complete; active state is HTTPS relay testing with release QR blocked until Rabbit reachability is verified.',
);
writeFile(paths.hermesMemory, hermesMemory);

const hermesRecord = JSON.parse(fs.readFileSync(paths.hermesRecord, 'utf8'));
hermesRecord.updated_at = isoNow;
hermesRecord.status = 'hermes_context_fast_path_optimized_https_relay_test_active';
hermesRecord.context_loading = {
  fast_path: paths.hermesContext,
  fallback_order: [
    '/Users/z3k3z/Documents/Omi Dev Space/rabbit-custom-creations-ui/docs/HERMES-HANDOFF.md',
    '/Users/z3k3z/Documents/AgentSharedMemory/shared/SOURCE-OF-TRUTH.md',
    '/Users/z3k3z/Documents/AgentSharedMemory/shared/session-index.json',
    '/Users/z3k3z/.hermes/memories/FEDERATED-MEMORY.md',
  ],
  rule: 'Use fast_path first for current Rabbit status; expand only for conflicts, history, checksums, or formal handoffs.',
};
hermesRecord.links = hermesRecord.links || {};
hermesRecord.links.rabbit_current_context_fast_path = paths.hermesContext;
hermesRecord.notes = hermesRecord.notes || [];
const newNote = `Hermes context optimized: use /Users/z3k3z/.hermes/memories/RABBIT-CURRENT-CONTEXT.md as the compact first-read path for Rabbit Superuser Management PWA status. It points to latest handoff/sync commit ${latestHandoffCommit} and route-state evidence commit b91bee7, keeps release QR blocked until Rabbit reachability is verified, and preserves the local-only relay-token rule without storing the token value.`;
hermesRecord.notes = [
  newNote,
  ...hermesRecord.notes.filter(
    (note) =>
      !note.includes('commit a18c191 Add Hermes handoff for Rabbit PWA') &&
      !note.includes('latest handoff commit 10a5099') &&
      !note.includes('latest handoff/sync commit 388f027') &&
      !note.includes('Latest repo handoff commit is 10a5099') &&
      !note.includes('Hermes context optimized on 2026-08-19') &&
      !note.includes('Hermes context optimized: use /Users/z3k3z/.hermes/memories/RABBIT-CURRENT-CONTEXT.md'),
  ),
];
writeFile(paths.hermesRecord, `${JSON.stringify(hermesRecord, null, 2)}\n`);

let sourceOfTruth = fs.readFileSync(paths.sourceOfTruth, 'utf8');
sourceOfTruth = sourceOfTruth.replace(
  '- Latest pushed handoff commit: `10a5099 Remove stale commit claims from Hermes handoff` (2026-08-19). Route-state evidence commit: `b91bee7 Record HTTPS relay test state`. GitHub Pages run `32243263171` completed successfully for the route-state update.',
  `- Latest pushed handoff/sync commit: \`${latestHandoffCommit}\` (2026-08-19). Route-state evidence commit: \`b91bee7 Record HTTPS relay test state\`. GitHub Pages deployments completed for the route-state and Hermes sync pushes; verify the latest run with \`gh run list --branch main\` when exact run evidence is needed.`,
);
sourceOfTruth = sourceOfTruth.replace(
  /- Latest pushed handoff\/sync commit: `[^`]+` \(2026-08-19\)\. Route-state evidence commit: `b91bee7 Record HTTPS relay test state`\. GitHub Pages .*?\./,
  `- Latest pushed handoff/sync commit: \`${latestHandoffCommit}\` (2026-08-19). Route-state evidence commit: \`b91bee7 Record HTTPS relay test state\`. GitHub Pages deployments completed for the route-state and Hermes sync pushes; verify the latest run with \`gh run list --branch main\` when exact run evidence is needed.`,
);
writeFile(paths.sourceOfTruth, sourceOfTruth);

const sessionIndex = JSON.parse(fs.readFileSync(paths.sessionIndex, 'utf8'));
sessionIndex.updatedAt = isoNow;
const codexSession = sessionIndex.sessions?.find(
  (session) => session.system === 'codex' && session.id === '019fb1cf-f072-77a1-bc6a-7afdc1a6a166',
);
if (codexSession) {
  codexSession.updatedAt = isoNow;
  codexSession.status = 'hermes_context_fast_path_synced_https_relay_test_active';
  codexSession.lastKnown =
    `Hermes context fast-path sync verified and pushed. Latest handoff/sync commit is ${latestHandoffCommit}; route-state evidence commit is b91bee7 Record HTTPS relay test state. Hermes should read /Users/z3k3z/.hermes/memories/RABBIT-CURRENT-CONTEXT.md first, then docs/HERMES-HANDOFF.md, and expand to SOURCE-OF-TRUTH/session-index only for conflicts or deeper history. Release QR remains blocked; Rabbit reachability is unverified. Relay token remains local-only at /private/tmp/rabbit-https-relay-token.txt and must not be copied into GitHub, QR, shared memory, screenshots, or transcripts. Next safe action is user-operated Rabbit Step 1 and Step 2 only, then stop and report exact Step 2 output. No Rabbit device command, root/SU, ADB, reboot, install, fastboot, recovery, flash, OpenClaw auth change, Hermes lifecycle change, or privileged execution occurred.`;
}
writeFile(paths.sessionIndex, `${JSON.stringify(sessionIndex, null, 2)}\n`);

let codexInbox = fs.readFileSync(paths.codexInbox, 'utf8');
const inboxEntry = `
## 2026-08-19 - Hermes context fast path optimized

- Added Hermes fast-path context at \`${paths.hermesContext}\` so Hermes can start Rabbit Superuser Management work from the current state without scanning the full federation.
- Updated Hermes loader and session snapshot to point to the current handoff/sync commit and route-state evidence commit \`b91bee7\`.
- Kept release QR blocked until Rabbit reachability is verified. Relay token remains path-only and local-only; no token value stored.
- No Rabbit device command, ADB, fastboot, recovery, reboot, install, root/SU, privileged execution, OpenClaw auth change, or Hermes lifecycle change occurred.
`;
if (!codexInbox.includes('Hermes context fast path optimized')) {
  codexInbox += inboxEntry;
  writeFile(paths.codexInbox, codexInbox);
}

console.log(JSON.stringify({ status: hermesRecord.status, written: paths }, null, 2));
