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
  hermesCodexHandoff: '/Users/z3k3z/.hermes/memories/codex-handoff.md',
  hermesMemory: '/Users/z3k3z/.hermes/memories/MEMORY.md',
  hermesSnapshot: '/Users/z3k3z/.hermes/memories/FEDERATED-SESSION-SNAPSHOT.md',
  hermesFederatedMemory: '/Users/z3k3z/.hermes/memories/FEDERATED-MEMORY.md',
  openclawCodexHandoff: '/Users/z3k3z/.openclaw/workspace/codex-handoff.md',
  openclawMemory: '/Users/z3k3z/.openclaw/workspace/MEMORY.md',
  openclawFederatedMemory: '/Users/z3k3z/.openclaw/workspace/FEDERATED-MEMORY.md',
  repoCodexHandoff: '/Users/z3k3z/Documents/Omi Dev Space/rabbit-custom-creations-ui/docs/codex-handoff.md',
  hermesRecord: '/Users/z3k3z/Documents/AgentSharedMemory/hermes/memory.json',
  sourceOfTruth: '/Users/z3k3z/Documents/AgentSharedMemory/shared/SOURCE-OF-TRUTH.md',
  sessionIndex: '/Users/z3k3z/Documents/AgentSharedMemory/shared/session-index.json',
  sharedCodexHandoff: '/Users/z3k3z/Documents/AgentSharedMemory/shared/distribution/rabbit-r1/codex-handoff.md',
  sharedArtifactCodexHandoff:
    '/Users/z3k3z/Documents/AgentSharedMemory/shared/artifacts/rabbit-r1/rabbit-superuser-pwa-codex-handoff-2026-08-19.md',
  sharedIndex: '/Users/z3k3z/Documents/AgentSharedMemory/shared/index.json',
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
2. If project details are needed: \`${paths.repoCodexHandoff}\`
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
- Rabbit-originated route/auth reachability is verified. Step 1 reported assets
  ready and core broker reachable; Step 2 reached the broker with privileged
  execution disabled.
- The latest UI fix unwraps forwarded relay responses so Step 2 can display
  \`selected rabbit_native_broker\` instead of \`selected undefined\`.
- Relay token path: \`/private/tmp/rabbit-https-relay-token.txt\`
- Do not store the relay token value in GitHub, QR codes, shared memory, screenshots, or chat logs.

## Next Safe Action

User-operated Rabbit confirmation only:

1. Reopen or reload the installed \`A1 Broker Test\` Creation.
2. Confirm Broker endpoint is \`https://michaels-macbook-pro.tailcfaeac.ts.net\`.
3. Keep the relay token entered manually from the local token file if the app
   does not retain it.
4. Run Step 2 only.
5. Stop and report whether Step 2 says \`selected rabbit_native_broker\`.

## Hard Stops

Do not run Rabbit device commands, ADB, fastboot, recovery, reboot, install, WebUSB/WebSerial, DA/Preloader, flashing, root/SU, on-device broker install, OpenClaw auth changes, Hermes lifecycle changes, or privileged execution unless the user gives separate explicit live authorization and current safety gates are rechecked.

## Efficiency Rule For Hermes

Use this file for the current answer path. Load the full federation only when resolving conflicts, checking older decisions, verifying checksums, or preparing a formal handoff. Prefer concise status plus exact next action over broad history scans.
`;

function writeFile(path, contents) {
  fs.writeFileSync(path, contents, { mode: 0o600 });
}

writeFile(paths.hermesContext, currentContext);
const codexHandoff = fs.readFileSync(paths.repoCodexHandoff, 'utf8');
writeFile(paths.hermesCodexHandoff, codexHandoff);
writeFile(paths.openclawCodexHandoff, codexHandoff);
writeFile(paths.sharedCodexHandoff, codexHandoff);
writeFile(paths.sharedArtifactCodexHandoff, codexHandoff);
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

For detailed project state, read the renamed Codex handoff:
\`${paths.hermesCodexHandoff}\`.

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
  /Latest repo handoff\/sync commit: .+?\. Route-state evidence commit: b91bee7\./g,
  `Latest repo handoff/sync commit: ${latestHandoffCommit}. Route-state evidence commit: b91bee7.`,
);
hermesMemory = hermesMemory.replaceAll(
  '/Users/z3k3z/Documents/Omi Dev Space/rabbit-custom-creations-ui/docs/HERMES-HANDOFF.md',
  paths.repoCodexHandoff,
);
hermesMemory = hermesMemory.replaceAll(
  '/Users/z3k3z/Documents/AgentSharedMemory/shared/distribution/rabbit-r1/hermes-handoff-rabbit-superuser-pwa-2026-08-14.md',
  paths.sharedCodexHandoff,
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
    paths.hermesCodexHandoff,
    paths.openclawCodexHandoff,
    paths.repoCodexHandoff,
    '/Users/z3k3z/Documents/AgentSharedMemory/shared/SOURCE-OF-TRUTH.md',
    '/Users/z3k3z/Documents/AgentSharedMemory/shared/session-index.json',
    '/Users/z3k3z/.hermes/memories/FEDERATED-MEMORY.md',
  ],
  rule: 'Use fast_path first for current Rabbit status; expand only for conflicts, history, checksums, or formal handoffs.',
};
hermesRecord.links = hermesRecord.links || {};
delete hermesRecord.links.rabbit_superuser_pwa_hermes_handoff;
delete hermesRecord.links.rabbit_superuser_pwa_shared_artifact;
delete hermesRecord.links.rabbit_superuser_pwa_distribution_handoff;
hermesRecord.links.rabbit_current_context_fast_path = paths.hermesContext;
hermesRecord.links.rabbit_superuser_pwa_latest_handoff = paths.repoCodexHandoff;
hermesRecord.links.rabbit_superuser_pwa_codex_handoff_hermes = paths.hermesCodexHandoff;
hermesRecord.links.rabbit_superuser_pwa_codex_handoff_openclaw = paths.openclawCodexHandoff;
hermesRecord.links.rabbit_superuser_pwa_codex_handoff_repo = paths.repoCodexHandoff;
hermesRecord.links.rabbit_superuser_pwa_codex_handoff_shared = paths.sharedCodexHandoff;
hermesRecord.links.rabbit_superuser_pwa_codex_handoff_shared_artifact = paths.sharedArtifactCodexHandoff;
hermesRecord.notes = hermesRecord.notes || [];
const newNote = `Hermes/OpenClaw Codex handoff imported: use /Users/z3k3z/.hermes/memories/RABBIT-CURRENT-CONTEXT.md as the compact first-read path, then /Users/z3k3z/.hermes/memories/codex-handoff.md for Hermes or /Users/z3k3z/.openclaw/workspace/codex-handoff.md for OpenClaw. Latest handoff/sync commit is ${latestHandoffCommit}; route-state evidence commit is b91bee7. Rabbit-originated route/auth reachability is verified, but release QR remains blocked until service, approval, and privileged-executor gates are validated. Relay token value is not stored.`;
hermesRecord.notes = [
  newNote,
  ...hermesRecord.notes.filter(
    (note) =>
      !note.includes('commit a18c191 Add Hermes handoff for Rabbit PWA') &&
      !note.includes('latest handoff commit 10a5099') &&
      !note.includes('latest handoff/sync commit 388f027') &&
      !note.includes('Latest repo handoff commit is 10a5099') &&
      !note.includes('Hermes context optimized on 2026-08-19') &&
      !note.includes('Hermes context optimized: use /Users/z3k3z/.hermes/memories/RABBIT-CURRENT-CONTEXT.md') &&
      !note.includes('Hermes/OpenClaw Codex handoff imported:') &&
      !note.includes('Handoff files are docs/HERMES-HANDOFF.md'),
  ),
];
writeFile(paths.hermesRecord, `${JSON.stringify(hermesRecord, null, 2)}\n`);

let openclawMemory = fs.readFileSync(paths.openclawMemory, 'utf8');
if (!openclawMemory.includes('## Rabbit Superuser Management Codex handoff')) {
  openclawMemory += `

## Rabbit Superuser Management Codex handoff

For Rabbit Superuser Management PWA, broker, or deployment-status work, read:
\`${paths.openclawCodexHandoff}\`.

Use \`${paths.sourceOfTruth}\` and \`${paths.sessionIndex}\` for conflicts or deeper history. Do not run Rabbit device commands, gateway lifecycle changes, root/SU, ADB, fastboot, recovery, reboot, install, flash, or privileged execution without separate explicit live authorization.
`;
}
openclawMemory = openclawMemory.replaceAll(
  '/Users/z3k3z/Documents/Omi Dev Space/rabbit-custom-creations-ui/docs/HERMES-HANDOFF.md',
  paths.repoCodexHandoff,
);
writeFile(paths.openclawMemory, openclawMemory);

let sourceOfTruth = fs.readFileSync(paths.sourceOfTruth, 'utf8');
sourceOfTruth = sourceOfTruth.replaceAll(
  '/Users/z3k3z/Documents/Omi Dev Space/rabbit-custom-creations-ui/docs/HERMES-HANDOFF.md',
  paths.repoCodexHandoff,
);
sourceOfTruth = sourceOfTruth.replaceAll(
  '/Users/z3k3z/Documents/AgentSharedMemory/shared/distribution/rabbit-r1/hermes-handoff-rabbit-superuser-pwa-2026-08-14.md',
  paths.sharedCodexHandoff,
);
sourceOfTruth = sourceOfTruth.replaceAll(
  'distribution/rabbit-r1/hermes-handoff-rabbit-superuser-pwa-2026-08-14.md',
  'distribution/rabbit-r1/codex-handoff.md',
);
sourceOfTruth = sourceOfTruth.replaceAll(
  'rabbit-custom-creations-ui/docs/HERMES-HANDOFF.md',
  'rabbit-custom-creations-ui/docs/codex-handoff.md',
);
sourceOfTruth = sourceOfTruth.replaceAll(
  'shared/artifacts/rabbit-r1/rabbit-superuser-pwa-hermes-handoff-2026-08-14.md',
  'shared/artifacts/rabbit-r1/rabbit-superuser-pwa-codex-handoff-2026-08-19.md',
);
sourceOfTruth = sourceOfTruth.replaceAll(
  'artifacts/rabbit-r1/rabbit-superuser-pwa-hermes-handoff-2026-08-14.md',
  'artifacts/rabbit-r1/rabbit-superuser-pwa-codex-handoff-2026-08-19.md',
);
sourceOfTruth = sourceOfTruth.replaceAll('Hermes handoff:', 'Codex handoff:');
sourceOfTruth = sourceOfTruth.replaceAll('rabbit_superuser_pwa_hermes', 'rabbit_superuser_pwa_codex');
sourceOfTruth = sourceOfTruth.replaceAll('rabbit_superuser_pwa_shared_artifact', 'rabbit_superuser_pwa_codex_shared_artifact');
sourceOfTruth = sourceOfTruth.replace(
  '- Latest pushed handoff commit: `10a5099 Remove stale commit claims from Hermes handoff` (2026-08-19). Route-state evidence commit: `b91bee7 Record HTTPS relay test state`. GitHub Pages run `32243263171` completed successfully for the route-state update.',
  `- Latest pushed handoff/sync commit: \`${latestHandoffCommit}\` (2026-08-19). Route-state evidence commit: \`b91bee7 Record HTTPS relay test state\`. GitHub Pages deployments completed for the route-state and Hermes sync pushes; verify the latest run with \`gh run list --branch main\` when exact run evidence is needed.`,
);
sourceOfTruth = sourceOfTruth.replace(
  /- Latest pushed handoff\/sync commit: `[^`]+` \(2026-08-19\)\. Route-state evidence commit: `b91bee7 Record HTTPS relay test state`\. GitHub Pages .*?\./,
  `- Latest pushed handoff/sync commit: \`${latestHandoffCommit}\` (2026-08-19). Route-state evidence commit: \`b91bee7 Record HTTPS relay test state\`. GitHub Pages deployments completed for the route-state and Hermes sync pushes; verify the latest run with \`gh run list --branch main\` when exact run evidence is needed.`,
);
writeFile(paths.sourceOfTruth, sourceOfTruth);
writeFile(paths.hermesFederatedMemory, sourceOfTruth);
writeFile(paths.openclawFederatedMemory, sourceOfTruth);

const sessionIndex = JSON.parse(fs.readFileSync(paths.sessionIndex, 'utf8'));
sessionIndex.updatedAt = isoNow;
const codexSession = sessionIndex.sessions?.find(
  (session) => session.system === 'codex' && session.id === '019fb1cf-f072-77a1-bc6a-7afdc1a6a166',
);
if (codexSession) {
  codexSession.updatedAt = isoNow;
  codexSession.status = 'hermes_context_fast_path_synced_https_relay_test_active';
  codexSession.lastKnown =
    `Codex handoff imported for Hermes and OpenClaw. Latest handoff/sync commit is ${latestHandoffCommit}; route-state evidence commit is b91bee7 Record HTTPS relay test state. Hermes should read /Users/z3k3z/.hermes/memories/RABBIT-CURRENT-CONTEXT.md first, then /Users/z3k3z/.hermes/memories/codex-handoff.md. OpenClaw should read /Users/z3k3z/.openclaw/workspace/codex-handoff.md. Expand to SOURCE-OF-TRUTH/session-index only for conflicts or deeper history. Rabbit-originated route/auth reachability is verified and release QR remains blocked until service, approval, and privileged-executor gates are validated. Relay token remains local-only at /private/tmp/rabbit-https-relay-token.txt and must not be copied into GitHub, QR, shared memory, screenshots, or transcripts. Next safe action is user-operated fixed Step 2 confirmation only, then stop and report whether it says selected rabbit_native_broker. No Rabbit device command, root/SU, ADB, reboot, install, fastboot, recovery, flash, OpenClaw auth change, Hermes lifecycle change, token disclosure, or privileged execution occurred.`;
}
writeFile(paths.sessionIndex, `${JSON.stringify(sessionIndex, null, 2)}\n`);

const sharedIndex = JSON.parse(fs.readFileSync(paths.sharedIndex, 'utf8'));
sharedIndex.handoffs = sharedIndex.handoffs || {};
sharedIndex.handoffs.rabbit_superuser_pwa = paths.repoCodexHandoff;
sharedIndex.handoffs.rabbit_superuser_pwa_codex = 'distribution/rabbit-r1/codex-handoff.md';
sharedIndex.handoffs.rabbit_superuser_pwa_codex_shared_artifact =
  'artifacts/rabbit-r1/rabbit-superuser-pwa-codex-handoff-2026-08-19.md';
delete sharedIndex.handoffs.rabbit_superuser_pwa_hermes;
delete sharedIndex.handoffs.rabbit_superuser_pwa_shared_artifact;
writeFile(paths.sharedIndex, `${JSON.stringify(sharedIndex, null, 2)}\n`);

let codexInbox = fs.readFileSync(paths.codexInbox, 'utf8');
const inboxEntry = `
## 2026-08-19 - Hermes context fast path optimized

- Added Hermes fast-path context at \`${paths.hermesContext}\` so Hermes can start Rabbit Superuser Management work from the current state without scanning the full federation.
- Imported renamed Codex handoff at \`${paths.hermesCodexHandoff}\` and \`${paths.openclawCodexHandoff}\`.
- Updated Hermes loader and session snapshot to point to the current handoff/sync commit and route-state evidence commit \`b91bee7\`.
- Kept release QR blocked until service, approval, and privileged-executor gates
  are validated. Relay token remains path-only and local-only; no token value
  stored.
- No Rabbit device command, ADB, fastboot, recovery, reboot, install, root/SU, privileged execution, OpenClaw auth change, or Hermes lifecycle change occurred.
`;
if (!codexInbox.includes('Hermes context fast path optimized')) {
  codexInbox += inboxEntry;
  writeFile(paths.codexInbox, codexInbox);
}

console.log(JSON.stringify({ status: hermesRecord.status, written: paths }, null, 2));
