# Hermes Full Project Context - Rabbit Superuser Management

Updated: 2026-08-19 08:58 PDT

Audience: Hermes, OpenClaw, Codex/ChatGPT, and any local assistant taking over
the Rabbit Superuser Management / Rabbit r1 Custom Creation work.

## Read Order

Hermes should use this document as the broad handoff. For current state, read in
this order:

1. `/Users/z3k3z/.hermes/memories/RABBIT-CURRENT-CONTEXT.md`
2. `/Users/z3k3z/Documents/Omi Dev Space/rabbit-custom-creations-ui/docs/HERMES-FULL-PROJECT-CONTEXT-2026-08-19.md`
3. `/Users/z3k3z/Documents/Omi Dev Space/rabbit-custom-creations-ui/docs/codex-handoff.md`
4. `/Users/z3k3z/Documents/AgentSharedMemory/shared/SOURCE-OF-TRUTH.md`
5. `/Users/z3k3z/Documents/AgentSharedMemory/shared/session-index.json`
6. Latest relevant file under `/Users/z3k3z/Documents/AgentSharedMemory/shared/snapshots/`
7. `/Users/z3k3z/Documents/AgentSharedMemory/shared/inbox/codex-chatgpt.md`

Only load the full federation when resolving conflicts, checking older Rabbit
state, verifying checksums, or preparing another formal handoff. Prefer the
fast-path context for normal status and next-step answers.

## Current Executive State

The active project is the Rabbit Superuser Management hosted PWA and testing
Custom Creation install flow.

- Repo: `https://github.com/beaudown/rabbit-custom-creations-ui`
- Local repo: `/Users/z3k3z/Documents/Omi Dev Space/rabbit-custom-creations-ui`
- GitHub Pages live app: `https://beaudown.github.io/rabbit-custom-creations-ui/`
- Hosted QR sheet: `https://beaudown.github.io/rabbit-custom-creations-ui/qr-launch-sheet.html`
- Current pushed commit: `c317312 Use Rabbit-format testing Creation QR`
- GitHub Pages deployment: run `32272038546`, completed successfully on
  2026-08-19.
- Current stage: user-operated Rabbit-side testing of the first Rabbit-format
  testing Creation QR, then Step 1 and Step 2 only.
- Release QR remains blocked: `releaseQrAllowed=false`.
- Rabbit external reachability remains unverified until the user reports exact
  Step 2 output from the r1.

No Rabbit device command, ADB, fastboot, recovery, reboot, install, WebUSB,
WebSerial, DA/Preloader, root/SU, flashing, on-device broker install, OpenClaw
auth change, Hermes lifecycle change, or privileged execution has occurred for
this checkpoint.

## Core Problem Solved

The user repeatedly saw "not a valid creation" / "not a custom creation" because
the QR codes were wrong for Rabbit's `Creations > add via QR` scanner.

Important rule:

Do not QR-encode a hosted URL, route-test URL, manifest JSON URL, lease-pairing
JSON URL, GitHub Pages URL, or broker metadata URL and call it a Rabbit Creation
install QR.

Rabbit's Creation add-via-QR scanner expects the Rabbit Creation JSON payload
shape produced by Rabbit's QR creator:

```json
{
  "title": "Rabbit SU Manager",
  "url": "https://beaudown.github.io/rabbit-custom-creations-ui/?broker=https%3A%2F%2Fmichaels-macbook-pro.tailcfaeac.ts.net",
  "description": "Testing-only Rabbit r1 broker readiness and audit control surface. Run Step 1 and Step 2 only.",
  "iconUrl": "https://beaudown.github.io/rabbit-custom-creations-ui/favicon.svg",
  "themeColor": "#FE5000"
}
```

The current hosted QR sheet's first QR encodes that JSON payload. The manifest
URL and lease-pairing JSON remain reference-only and must not be presented as
Creation install QRs.

Never embed the relay token, auth headers, local-only paths, one-time
credentials, OpenClaw/Hermes secrets, GitHub tokens, or private data in a QR.

## Current User Test Instructions

Give the user these steps exactly, unless a newer verified handoff supersedes
them:

1. Open this page and reload it:
   `https://beaudown.github.io/rabbit-custom-creations-ui/qr-launch-sheet.html`
2. On r1, open `Creations`.
3. Tap `add via QR`.
4. Scan only the first QR labeled `Testing Creation install QR`.
5. Open the installed `Rabbit SU Manager` card.
6. Confirm the broker endpoint is
   `https://michaels-macbook-pro.tailcfaeac.ts.net`.
7. Enter the relay token manually from the Mac file only if the app asks for it:
   `/private/tmp/rabbit-https-relay-token.txt`
8. Run `Step 1`.
9. Run `Step 2`.
10. Stop and report the exact Step 2 output.

Do not tell the user to tap Step 3, service status, approval dialog, ADB,
fastboot, root, reboot, install, cleanup, or storage controls until Step 2 is
reported and reviewed.

## Deployment State and Verification

Latest verified deployment:

- Commit: `c317312 Use Rabbit-format testing Creation QR`
- GitHub Pages run: `32272038546`
- Run status: completed successfully.
- Hosted HTML verification found:
  - `Testing Creation install QR`
  - encoded `title` field
  - encoded `url` field
  - encoded `description` field
  - encoded `iconUrl` field
  - encoded `themeColor` field

Validation that passed after the QR correction:

```bash
cd "/Users/z3k3z/Documents/Omi Dev Space/rabbit-custom-creations-ui"
npm run lint
npm run broker:validate
npm test -- --runInBand
```

Expected test result:

- 25/25 tests passing.
- Localhost broker/relay tests require normal localhost permissions; sandboxed
  runs can fail with `listen EPERM` or broker fetch failures.

The GitHub Pages build uses the repository's existing workflow. To check latest
deploy state:

```bash
cd "/Users/z3k3z/Documents/Omi Dev Space/rabbit-custom-creations-ui"
gh run list --branch main --limit 6
gh run watch <run-id> --exit-status
```

To verify the hosted QR sheet contains the Rabbit-format payload:

```bash
curl -fsSL https://beaudown.github.io/rabbit-custom-creations-ui/qr-launch-sheet.html \
  | rg -n "Testing Creation install QR|title%22%3A%22Rabbit%20SU%20Manager|themeColor%22%3A%22%23FE5000"
```

## Local File Locations

Primary project:

- Repo root:
  `/Users/z3k3z/Documents/Omi Dev Space/rabbit-custom-creations-ui`
- Live app:
  `https://beaudown.github.io/rabbit-custom-creations-ui/`
- Hosted QR sheet:
  `https://beaudown.github.io/rabbit-custom-creations-ui/qr-launch-sheet.html`
- Current full Hermes context:
  `/Users/z3k3z/Documents/Omi Dev Space/rabbit-custom-creations-ui/docs/HERMES-FULL-PROJECT-CONTEXT-2026-08-19.md`
- Current Codex handoff:
  `/Users/z3k3z/Documents/Omi Dev Space/rabbit-custom-creations-ui/docs/codex-handoff.md`
- Current status log:
  `/Users/z3k3z/Documents/Omi Dev Space/rabbit-custom-creations-ui/docs/CURRENT-STATUS-LOG.md`
- QR docs:
  `/Users/z3k3z/Documents/Omi Dev Space/rabbit-custom-creations-ui/public/qr-launch-sheet.html`
  and
  `/Users/z3k3z/Documents/Omi Dev Space/rabbit-custom-creations-ui/docs/QR-LAUNCH-SHEET.html`

Hermes-local context:

- Fast path:
  `/Users/z3k3z/.hermes/memories/RABBIT-CURRENT-CONTEXT.md`
- Existing Codex handoff mirror:
  `/Users/z3k3z/.hermes/memories/codex-handoff.md`
- Mirror target for this document:
  `/Users/z3k3z/.hermes/memories/HERMES-FULL-PROJECT-CONTEXT-2026-08-19.md`

OpenClaw-local context:

- Codex handoff mirror:
  `/Users/z3k3z/.openclaw/workspace/codex-handoff.md`
- OpenClaw `main` owns the recurring Rabbit federation heartbeat. Do not start,
  stop, unload, or replace OpenClaw gateway ownership from this handoff.

Shared federation:

- Source of truth:
  `/Users/z3k3z/Documents/AgentSharedMemory/shared/SOURCE-OF-TRUTH.md`
- Session index:
  `/Users/z3k3z/Documents/AgentSharedMemory/shared/session-index.json`
- Codex inbox:
  `/Users/z3k3z/Documents/AgentSharedMemory/shared/inbox/codex-chatgpt.md`
- Distribution handoff:
  `/Users/z3k3z/Documents/AgentSharedMemory/shared/distribution/rabbit-r1/codex-handoff.md`
- Artifact handoff:
  `/Users/z3k3z/Documents/AgentSharedMemory/shared/artifacts/rabbit-r1/rabbit-superuser-pwa-codex-handoff-2026-08-19.md`

Sensitive local-only file:

- Relay token path:
  `/private/tmp/rabbit-https-relay-token.txt`
- Do not print, copy, commit, screenshot, QR-encode, or store the token value.

Other related Rabbit project roots:

- Rabbit Glide keyboard:
  `/Users/z3k3z/Documents/Omi Dev Space/rabbit-glide-keyboard`
- Rabbit GitHub QR PWA:
  `/Users/z3k3z/Documents/Omi Dev Space/rabbit-github-qr`
- Rabbit development hub:
  `/Users/z3k3z/Documents/Omi Dev Space/rabbit-r1-development-hub`
- Exported temporary-root broker skill:
  `/Users/z3k3z/Documents/Omi Dev Space/exported-skills/rabbit-r1-temp-root-broker`

## Important Repo Files

Frontend:

- `src/main.tsx`
- `src/App.tsx` if present in future revisions
- `app/page.tsx` and `app/globals.css` are listed in older docs, but verify
  actual current framework structure before editing.
- `public/manifest.webmanifest`
- `public/sw.js`
- `public/qr-launch-sheet.html`

Creation package:

- `public/creation-skill/manifest.json`
- `public/creation-skill/creation-launcher.json`
- `public/creation-skill/settings.json`
- `public/creation-skill/instructions.md`
- `public/creation-skill/first-run-readiness.md`
- `public/creation-skill/enablement-guide.md`
- `public/creation-skill/broker-service-guide.md`
- `public/creation-skill/custom-skill-uploader.md`
- `public/creation-skill/usb-storage-guide.md`
- `public/creation-skill/walkthrough-guide.md`
- `public/creation-skill/execution-checklist.md`

Broker contracts:

- `public/broker/audit-manifest.json`
- `public/broker/audit-log.jsonl`
- `public/broker/broker-coordination.json`
- `public/broker/sync-manifest.json`
- `public/broker/gateway-topology.json`
- `public/broker/rabbit-native-broker-spec.json`
- `public/broker/remote-broker-config.json`
- `public/broker/mac-local-broker-config.json`
- `public/broker/lease-pairing.json`
- `public/broker/prompt-library.json`
- `public/broker/walkthrough-guide.json`
- `public/broker/execution-checklist.json`
- `public/broker/request-templates/*.json`

Scripts:

- `scripts/mac-local-broker.mjs`
- `scripts/gateway-relay.mjs`
- `scripts/relay-preflight.mjs`
- `scripts/export-broker-sync.mjs`
- `scripts/manage-audit-log.mjs`
- `scripts/validate-superuser-package.mjs`
- `scripts/sync-hermes-context.mjs`

Tests:

- `tests/rendered-html.test.mjs`
- `tests/gateway-relay.test.mjs`
- `tests/mac-broker-handshake.test.mjs`
- `tests/relay-preflight.test.mjs`
- `tests/package-readiness.test.mjs`
- `tests/audit-management.test.mjs`
- `tests/sync-export.test.mjs`

Docs:

- `docs/HERMES-FULL-PROJECT-CONTEXT-2026-08-19.md`
- `docs/codex-handoff.md`
- `docs/CURRENT-STATUS-LOG.md`
- `docs/QR-LAUNCH-SHEET.html`
- `docs/https-relay-test-2026-08-19.md`
- `docs/gateway-relay.md`
- `docs/mac-local-broker.md`
- `docs/remote-broker-topology.md`
- `docs/rabbit-native-broker.md`
- `docs/github-sync.md`
- `docs/broker-audit-log.md`
- `docs/DEPENDENCY-FILE-INVENTORY.md`
- `docs/ROADMAP-WIREFRAME.md`

## Current Git State Caveat

As of this handoff, these runtime broker files may be locally modified or
untracked:

- `public/broker/audit-log.jsonl`
- `public/broker/broker-coordination.json`
- `public/broker/lease-pairing.json`
- `public/broker/queue/inbox/verify-action-control-temp-su-20260818.json`
- `public/broker/queue/inbox/verify-action-control-temp-su-20260818b.json`
- `public/broker/queue/inbox/verify-temp-su-dry-run-20260818.json`

Treat those as runtime/audit/queue state. Do not commit, reset, delete, or
overwrite them unless the user explicitly requests that exact action.

## Broker and Relay Architecture

The project models a two-broker topology:

- Rabbit-native broker: preferred future on-device executor. Not installed.
- Mac local fallback broker: bootstrap/lab coordinator and dry-run/status
  endpoint.
- GitHub Pages: static app and contract hosting only. It is not an executor.
- Creation/PWA: caller/control UI only. It must not directly execute privileged
  changes.
- Gateway relay: authenticated HTTPS sidecar for route testing from Rabbit to
  the Mac broker.

Current route:

- Public HTTPS test route:
  `https://michaels-macbook-pro.tailcfaeac.ts.net`
- Local relay:
  `127.0.0.1:8794`
- Mac broker:
  `http://100.80.216.88:8792`

Known host-side evidence from the handoff:

- Mac broker `/health` returned:
  - `privilegedExecutionEnabled=false`
  - `containsRootPayload=false`
- Public `/relay/health` returned:
  - `relay_configured_for_https_test`
  - `requiresAuth=true`
  - `publicUrlUsesHttps=true`
  - `privilegedExecutionEnabled=false`
  - `exposesGatewaySecrets=false`
- Authenticated public `/health` forwarded to broker and returned:
  - `privilegedExecutionPerformed=false`
  - `persistentChange=false`
  - `otaBreakingChange=false`

This is host-side evidence only. It does not prove Rabbit can reach the route.

## Known Failure Points

Keep these in view while troubleshooting:

- Stale local file: the in-app browser may show
  `file:///Users/z3k3z/Documents/Omi%20Dev%20Space/rabbit-custom-creations-ui/public/qr-launch-sheet.html`.
  The user should scan from the hosted page after deploy unless explicitly
  testing local HTML.
- Invalid QR type: any QR that encodes only a URL or `manifest.json` will fail
  in `Creations > add via QR`.
- Wrong scanner path: r1 Creation install testing must use `Creations > add via
  QR`, not an arbitrary camera/browser scanner.
- Broker route mismatch: if the Creation opens but route/service checks fail,
  confirm the broker endpoint is exactly
  `https://michaels-macbook-pro.tailcfaeac.ts.net`.
- Token missing: relay token is manual-only. If not entered, authenticated broker
  calls can fail.
- Rabbit external reachability: still unverified. Hosted `release-gate.json`
  keeps `externalRabbitReachabilityVerified=false`.
- HTTP private route: raw `http://100.80.216.88:8792` should not be treated as a
  Rabbit-reachable public Creation route.
- Service/status cascade: if Step 2 route fails, later service, approval, and
  gateway relay checks will likely fail from the same route blocker. Stop early.
- Public exposure risk: never switch to tokenless public proxy/funnel.
- Device-safety risk: no persistent root, partition writes, slot changes, reboot
  modes, APK installs, or OTA-breaking changes without explicit live approval.

## Deployment Procedure

Use this for safe repo-only deployments:

1. Inspect state:

   ```bash
   cd "/Users/z3k3z/Documents/Omi Dev Space/rabbit-custom-creations-ui"
   git status --short
   ```

2. Keep runtime files separate. Do not stage broker audit/queue runtime state
   unless explicitly requested.

3. Validate:

   ```bash
   npm run lint
   npm run broker:validate
   npm test -- --runInBand
   ```

4. Stage only intended files:

   ```bash
   git add <intended-files-only>
   git diff --cached --stat
   git diff --cached --name-only
   ```

5. Commit:

   ```bash
   git commit -m "<clear message>"
   ```

6. Push:

   ```bash
   git push origin main
   ```

7. Watch Pages:

   ```bash
   gh run list --branch main --limit 5
   gh run watch <run-id> --exit-status
   ```

8. Verify hosted artifact:

   ```bash
   curl -fsSL https://beaudown.github.io/rabbit-custom-creations-ui/qr-launch-sheet.html \
     | rg -n "Testing Creation install QR|Rabbit%20SU%20Manager|themeColor%22%3A%22%23FE5000"
   ```

9. Update handoffs if the next safe action changed:

   - `docs/codex-handoff.md`
   - `docs/CURRENT-STATUS-LOG.md`
   - `/Users/z3k3z/Documents/AgentSharedMemory/shared/inbox/codex-chatgpt.md`
   - `/Users/z3k3z/Documents/AgentSharedMemory/shared/session-index.json`
   - Hermes mirror files if relevant.

## Safety Boundary

Allowed without new live Rabbit approval:

- Read files and docs.
- Run repo validation/tests.
- Inspect GitHub Pages deploy state.
- Verify hosted HTTP resources.
- Edit and deploy static UI/docs/contracts.
- Start or inspect safe Mac broker only for dry-run/status checks if already
  within the established host-side workflow.
- Update handoff docs and shared memory.

Not allowed without separate explicit live device approval:

- ADB.
- Fastboot.
- WebUSB/WebSerial.
- DA/preloader tooling.
- Root/SU payloads.
- Reboots or boot-mode changes.
- Recovery/fastboot mode transitions.
- Storage exposure/mass-storage changes.
- APK install.
- On-device broker install.
- Persistent service modification on Rabbit.
- Slot changes, partition reads/writes, flashing, erasing, or format actions.
- OpenClaw or Hermes gateway lifecycle changes.
- Disabling auth, exposing tokenless public routes, or embedding secrets in QR
  codes.

## Skills Hermes Can Adopt or Mirror

Rabbit federation:

- Codex skill: `rabbit-r1-federated-memory-sync`
- Skill path in Codex:
  `/Users/z3k3z/.codex/skills/rabbit-r1-federated-memory-sync`
- Use for explicit Rabbit memory reconciliation and cross-model continuity.
- Never use it to run Rabbit device commands or gateway lifecycle changes.

OpenClaw remote dashboard:

- Codex skill: `rabbit-openclaw-remote-dashboard`
- Skill path:
  `/Users/z3k3z/.codex/skills/rabbit-openclaw-remote-dashboard`
- Use for explaining or verifying OpenClaw dashboard routing while preserving
  `ai.openclaw.gateway` as the single gateway owner.
- Do not create a second gateway or expose credentials.

Temporary-root broker planning:

- Exported skill:
  `/Users/z3k3z/Documents/Omi Dev Space/exported-skills/rabbit-r1-temp-root-broker`
- Use as a planning/reference skill only until explicit live safety gates are
  reopened.
- Architecture: Mac-side RAM-only bootstrap launcher, Rabbit-side privileged
  broker, Creation/control UI.
- Blocks persistent root, partition writes, slot-A modification, unvalidated
  public payloads, and broad authorization.

Ollama optimization:

- Shared skill path:
  `/Users/z3k3z/Documents/AgentSharedMemory/shared/distribution/rabbit-r1/2026-08-08/development-hub/skills/ollama-optimized-launch/`
- OpenClaw mirror:
  `/Users/z3k3z/.openclaw/workspace/skills/ollama-optimized-launch/`
- Model tag:
  `gemma4:12b-optimized`
- Purpose: keep Hermes/OpenClaw local-model context efficient with 16k context
  and tuned batch settings.

Efficiency instruction for Hermes:

- Start with `/Users/z3k3z/.hermes/memories/RABBIT-CURRENT-CONTEXT.md`.
- Use this document for broad context.
- Use `docs/codex-handoff.md` for exact current repo details.
- Load full shared federation only for conflicts, stale claims, or checksum
  verification.
- Keep answers short for the user: state current gate, exact next step, and
  whether the action is host-only or Rabbit-device-affecting.

## GitHub Repo Information

- Owner/repo: `beaudown/rabbit-custom-creations-ui`
- Remote: `https://github.com/beaudown/rabbit-custom-creations-ui.git`
- Branch: `main`
- Pages URL: `https://beaudown.github.io/rabbit-custom-creations-ui/`
- QR launch sheet:
  `https://beaudown.github.io/rabbit-custom-creations-ui/qr-launch-sheet.html`
- Latest pushed commit at handoff:
  `c317312 Use Rabbit-format testing Creation QR`
- Latest successful Pages run at handoff:
  `32272038546`

## Official External References

Rabbit support says third-party creations should be hosted and installed with
the QR code creator in Rabbit's GitHub repository:

- `https://www.rabbit.tech/support/article/how-to-use-r1-creations`
- `https://github.com/rabbit-hmi-oss/creations-sdk`
- QR creator source:
  `https://github.com/rabbit-hmi-oss/creations-sdk/tree/main/qr`

The QR creator encodes JSON data for the QR. Do not infer undocumented fields
without checking the current official source.

## Next Needed Work

Immediate next step:

- Wait for the user to test the hosted first QR through r1
  `Creations > add via QR`.
- User should report exact Step 2 output.

If Step 2 succeeds:

1. Record the exact output in `docs/CURRENT-STATUS-LOG.md`,
   `docs/codex-handoff.md`, and shared federation.
2. Re-run `npm run relay:preflight` with the public URL/token configured without
   printing token values.
3. Consider marking `externalRabbitReachabilityVerified=true` only if the
   evidence is genuinely Rabbit-originated.
4. Decide whether Step 3 service-status check is safe to expose next.

If Step 2 fails:

1. Do not continue to service, approval, ADB, root, reboot, install, or cleanup
   controls.
2. Capture exact error text.
3. Check whether the installed card is loading the latest hosted app.
4. Confirm broker endpoint string exactly.
5. Confirm relay token was entered manually.
6. Check public `/relay/health` and authenticated `/health` from the Mac side
   without printing token values.
7. If the failure is QR-install-level, re-check Rabbit's current QR payload
   requirements against `rabbit-hmi-oss/creations-sdk`.

Longer-term work:

- Build a Rabbit-native broker path only after live safety gates reopen.
- Keep Mac broker fallback as a bootstrap/lab coordinator, not the preferred
  long-term executor.
- Add a Rabbit-visible approval dialog surface only after route and service
  gates pass.
- Keep all privileged actions warning-gated, logged, reversible where possible,
  and restart-scoped unless the user explicitly approves persistent changes.
- Maintain UI standards: small-screen Rabbit portrait-first, bounded text,
  tap-to-expand diagnostics, high contrast, no rotate mode unless redesigned and
  verified.

## Final Reminder for Hermes

The user is trying to move fast and is frustrated by repeated invalid QR scans.
Do not give another QR or testing instruction unless you have verified whether
it is:

- a Rabbit Creation install QR payload, or
- a browser/route URL, or
- a manifest/reference URL.

State that distinction plainly every time. Keep testing in one place: the hosted
QR sheet and the Rabbit SU Manager Creation card.
