# Hermes Handoff - Rabbit Superuser Management PWA

Compatibility alias. The canonical handoff filename for Hermes and OpenClaw is
`docs/codex-handoff.md`.

Updated: 2026-08-19 10:39 PDT

## Current Override - HTTPS Relay Test

This section supersedes older August 14 acceptance notes in this file.

Current Hermes local fast path:
`/Users/z3k3z/.hermes/memories/RABBIT-CURRENT-CONTEXT.md`.
Hermes should read that compact context first, then this handoff, and only load
the full federation for conflicts, older decisions, checksums, or formal
handoffs.

Current handoff/sync source: current `main` version of this file plus
`scripts/sync-hermes-context.mjs`.
Current route-state commit: `b91bee7 Record HTTPS relay test state`.
Hermes handoff update: use the current `main` version of this file; the
route-state evidence remains `b91bee7`.
Current GitHub Pages deploy state: deployments have completed successfully for
the route-state and handoff-sync pushes; verify the newest exact run with
`gh run list --branch main` when needed.

Current state:

- Public HTTPS relay test route is configured.
- Release QR is still blocked: `releaseQrAllowed=false`.
- Testing QR is allowed only for route/service diagnostics.
- Rabbit-originated route/auth reachability is verified from the user's Step 1
  and Step 2 output.
- Step 2 currently needs the deployed UI unwrap fix because the relay envelope
  caused the display to say `selected undefined`.
- No relay token is stored in GitHub, shared memory, QR payloads, or this file.
- No Rabbit device command, ADB, fastboot, root/SU, reboot, install, recovery,
  flash, OpenClaw auth change, Hermes lifecycle change, or privileged execution
  has occurred.

Active public test route:

- Hosted app with broker prefilled:
  `https://beaudown.github.io/rabbit-custom-creations-ui/?creation=A1BrokerTestV2&broker=https%3A%2F%2Fmichaels-macbook-pro.tailcfaeac.ts.net`
- Broker endpoint inside the app:
  `https://michaels-macbook-pro.tailcfaeac.ts.net`
- Relay token location on the Mac only:
  `/private/tmp/rabbit-https-relay-token.txt`

Verified host-side evidence:

- Mac broker `/health` on `http://100.80.216.88:8792` returns
  `privilegedExecutionEnabled=false` and `containsRootPayload=false`.
- Temporary launchd job `rabbit.https.relay` runs
  `scripts/gateway-relay.mjs` on `127.0.0.1:8794`.
- Tailscale Funnel proxies
  `https://michaels-macbook-pro.tailcfaeac.ts.net/` to
  `http://127.0.0.1:8794`.
- Public `/relay/health` returns `relay_configured_for_https_test`,
  `requiresAuth=true`, `publicUrlUsesHttps=true`,
  `privilegedExecutionEnabled=false`, and `exposesGatewaySecrets=false`.
- Authenticated public `/health` forwards to the Mac broker and returns
  `privilegedExecutionPerformed=false`, `persistentChange=false`, and
  `otaBreakingChange=false`.
- Rabbit Step 1 reported `ready_for_single_creation_use: assets ready core broker reachable`.
- Rabbit Step 2 reported `Broker online selected undefined privilege, execution, disabled`.
- `selected undefined` is a display unwrap bug, not evidence that the route
  target is absent; direct/relay broker checks return `rabbit_native_broker`.
- `npm run relay:preflight` with the public URL and token configured reports
  `relayProbe.ok=true`; `releaseReady=false` remains correct because privileged
  execution and release gates are not validated.

Current Rabbit test instructions:

1. Scan only the testing QR for the hosted app URL above.
2. Confirm Broker endpoint is `https://michaels-macbook-pro.tailcfaeac.ts.net`.
3. Enter the relay token manually from `/private/tmp/rabbit-https-relay-token.txt`.
4. After the UI unwrap fix is deployed, tap Step 2 only.
5. Confirm the output names `selected rabbit_native_broker`.
6. Stop and record the exact Step 2 output.

Do not tap Step 3 or later until the fixed Step 2 label is reported back and reviewed.

Detailed task note:

- `docs/https-relay-test-2026-08-19.md`

Current GitHub-hosted release state:

- `public/broker/release-gate.json` has
  `gatewayRelayPublicHttpsConfigured=true`,
  `externalRabbitReachabilityVerified=true`, and `releaseQrAllowed=false`.
- `public/broker/remote-broker-config.json` has gatewayRelay status
  `public_https_route_verified_from_rabbit_privileged_blocked`.

## Executive State

Codex/ChatGPT safe host-side route work is complete. The next package update
must deploy the route response unwrap fix, update status gates, validate, push,
and then wait for one fixed Rabbit Step 2 confirmation.

The current step is ready for fixed Step 2 confirmation:

1. Scan the testing QR for the hosted app with broker prefilled to the HTTPS
   relay URL.
2. Enter the relay token manually.
3. Run Step 2.
4. Confirm the route label is `rabbit_native_broker`.
5. Stop before Step 3, service status, approval dialog, gateway probe, ADB,
   fastboot, root/SU, reboot mode, storage exposure, APK
   install, on-device broker install, or other device-affecting action unless
   the user gives separate live action-time approval.

No Rabbit device command or privileged device action has been run for this
package checkpoint.

## GitHub and Hosted URLs

- GitHub repo: `https://github.com/beaudown/rabbit-custom-creations-ui`
- Current handoff/sync source: current `main` version of this file plus
  `scripts/sync-hermes-context.mjs`
- Route-state commit: `b91bee7 Record HTTPS relay test state`
- Hermes handoff update: current `main` version of this file
- Live PWA: `https://beaudown.github.io/rabbit-custom-creations-ui/`
- Hosted QR sheet: `https://beaudown.github.io/rabbit-custom-creations-ui/qr-launch-sheet.html`
- Creation manifest: `https://beaudown.github.io/rabbit-custom-creations-ui/creation-skill/manifest.json`
- Lease pairing target: `https://beaudown.github.io/rabbit-custom-creations-ui/broker/lease-pairing.json`
- HTTPS relay test note: `https://github.com/beaudown/rabbit-custom-creations-ui/blob/main/docs/https-relay-test-2026-08-19.md`
- Release gate: `https://beaudown.github.io/rabbit-custom-creations-ui/broker/release-gate.json`
- Remote broker config: `https://beaudown.github.io/rabbit-custom-creations-ui/broker/remote-broker-config.json`
- GitHub Pages deploy state: latest exact run should be checked with
  `gh run list --branch main` when run-level evidence is needed.

Hosted release gate and remote broker config were verified after the final push.

## Local Project Locations

- Repo root:
  `/Users/z3k3z/Documents/Omi Dev Space/rabbit-custom-creations-ui`
- Desktop handoff zip:
  `/Users/z3k3z/Desktop/rabbit-r1-superuser-handoff-caf4dec.zip`
- Desktop zip SHA-256:
  `ab417721914706c75f3fce18e72c0867ffad6837e9b08ed21f81a4a267abd221`
- Shared Rabbit memory root:
  `/Users/z3k3z/Documents/AgentSharedMemory/shared`
- Codex shared-memory inbox:
  `/Users/z3k3z/Documents/AgentSharedMemory/shared/inbox/codex-chatgpt.md`
- Current session index:
  `/Users/z3k3z/Documents/AgentSharedMemory/shared/session-index.json`
- Rabbit source of truth:
  `/Users/z3k3z/Documents/AgentSharedMemory/shared/SOURCE-OF-TRUTH.md`

## Required Read Order for Hermes

Read these before making claims about current Rabbit state:

1. `/Users/z3k3z/.hermes/memories/RABBIT-CURRENT-CONTEXT.md`
2. This file:
   `/Users/z3k3z/Documents/Omi Dev Space/rabbit-custom-creations-ui/docs/HERMES-HANDOFF.md`
3. `/Users/z3k3z/Documents/AgentSharedMemory/shared/SOURCE-OF-TRUTH.md`
4. `/Users/z3k3z/Documents/AgentSharedMemory/shared/session-index.json`
5. Latest relevant snapshot under:
   `/Users/z3k3z/Documents/AgentSharedMemory/shared/snapshots/`
6. Current project status log:
   `/Users/z3k3z/Documents/Omi Dev Space/rabbit-custom-creations-ui/docs/CURRENT-STATUS-LOG.md`

## Safety Boundary

Allowed without new live approval:

- Inspect files.
- Run package validation and tests.
- Start safe Mac broker for dry-run/status checks only.
- Update GitHub docs/logs after user-reported results.
- Rebuild the handoff zip.

Not allowed without separate live device approval:

- ADB.
- Fastboot.
- WebUSB/WebSerial.
- DA/preloader tooling.
- Root/SU payloads.
- Reboots or boot-mode changes.
- Storage exposure/mass-storage mode changes.
- APK install.
- On-device broker install.
- OpenClaw or Hermes gateway lifecycle changes.
- Any persistent device modification.

## Core Package Files

Frontend:

- `app/page.tsx`
- `app/globals.css`
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

Tests:

- `tests/audit-management.test.mjs`
- `tests/mac-broker-handshake.test.mjs`
- `tests/package-readiness.test.mjs`
- `tests/gateway-relay.test.mjs`
- `tests/relay-preflight.test.mjs`
- `tests/rendered-html.test.mjs`
- `tests/sync-export.test.mjs`

Docs:

- `docs/CURRENT-STATUS-LOG.md`
- `docs/DEPENDENCY-FILE-INVENTORY.md`
- `docs/QR-LAUNCH-SHEET.html`
- `docs/ROADMAP-WIREFRAME.md`
- `docs/HERMES-HANDOFF.md`
- `docs/broker-audit-log.md`
- `docs/github-sync.md`
- `docs/gateway-relay.md`
- `docs/https-relay-test-2026-08-19.md`
- `docs/mac-local-broker.md`
- `docs/rabbit-native-broker.md`
- `docs/remote-broker-topology.md`

Generated/rebuildable:

- `dist/` from `npm run build`
- `node_modules/` from `npm install`

## Local Skill and Special Context

Local project skill:

- `skills/rabbit-broker-workflow/SKILL.md`
- `skills/rabbit-broker-workflow/references/broker-workflow.md`
- `skills/rabbit-broker-workflow/scripts/validate_broker_request.py`
- `skills/rabbit-broker-workflow/agents/openai.yaml`

Federated memory skill context:

- Rabbit federation is owned by OpenClaw `main`, not Codex.
- Scheduled Rabbit memory sync uses the installed
  `rabbit-r1-federated-memory-sync` skill through OpenClaw.
- Hermes should treat native memory as a loader/cache and the shared memory
  folder as the continuity source of truth.

Codex/GitHub work used normal local git and `gh` CLI. No GitHub secret was
written into the repo or shared memory.

## npm Commands

Run from:

```bash
cd "/Users/z3k3z/Documents/Omi Dev Space/rabbit-custom-creations-ui"
```

Validation:

```bash
npm run broker:validate
npm run lint
npm test
```

Audit maintenance:

```bash
npm run audit:status
npm run audit:archive
npm run audit:query -- dry_run
```

Broker:

```bash
npm run broker:mac
npm run relay:gateway
npm run relay:preflight
```

The active Mac broker for this test is reachable from the Mac at
`http://100.80.216.88:8792`. The active relay listens locally at
`http://127.0.0.1:8794` and is exposed to Rabbit through the approved Tailscale
Funnel HTTPS route. Do not expose the raw broker or any token-bearing URL.

Broker status endpoints:

```text
GET /health
GET /bridge/route
GET /broker/service
GET /adb/status
```

Broker service-control rule:

- New broker startup must close or yield stale broker route ownership.
- It must clear transient route cache, stale endpoint selection, presence
  claims, pending service-control state, and stale capability detection.
- It must preserve audit history, queue files, rollback records, published
  templates, and Rabbit-local current-boot superuser state.
- It must expose cleanup evidence through `/health` and `/broker/service`.

## Last Validation Result

Passed:

- `npm run audit:status`
- `npm run audit:query -- dry_run`
- `npm run broker:validate`
- `npm run lint`
- `npm test` with localhost permission, 25/25 passing
- GitHub Pages deployment run `32243263171`
- Hosted release gate shows HTTPS configured but Rabbit reachability unverified
- Public HTTPS relay health and authenticated broker forwarding verified
- Hermes context fast-path sync passed local write verification and the Rabbit
  federation validator returned `status=ok`

Local repo status at handoff:

```text
main...origin/main with local runtime broker audit/queue files
remaining intentionally uncommitted
```

Temporary relay/broker test services may be running for the user test. Do not
restart or change them unless explicitly asked.

## What Hermes Should Do Next

First safe task:

1. Wait for the user's exact Rabbit Step 1 and Step 2 outputs.
2. If Step 2 fails, keep release QR blocked and record the exact route failure.
3. If Step 2 passes, update GitHub docs and shared memory, then test only the
   next safe broker status/control surface after explicit confirmation.
4. Do not store the relay token in any repo, QR, shared memory, screenshot, or
   public note.
5. Keep release QR blocked until route, service status, approval dialog, and
   gateway relay checks all return controlled responses.

Do not start live device-affecting tests until the user gives separate explicit
live authorization at action time.
