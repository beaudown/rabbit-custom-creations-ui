# Hermes Handoff - Rabbit Superuser Management PWA

Updated: 2026-08-14 20:20 PDT

## Executive State

Codex/ChatGPT safe host-side work is complete. The package is published,
validated, zipped for handoff, and logged in the Rabbit federated memory.

The current step is ready for live acceptance testing:

1. Open the GitHub-hosted QR sheet.
2. Open the PWA on Rabbit r1.
3. Import or call the Custom Creation manifest.
4. Run First Run / Readiness.
5. Stop before any ADB, fastboot, root/SU, reboot mode, storage exposure, APK
   install, on-device broker install, or other device-affecting action unless
   the user gives separate live action-time approval.

No Rabbit device command or privileged device action has been run for this
package checkpoint.

## GitHub and Hosted URLs

- GitHub repo: `https://github.com/beaudown/rabbit-custom-creations-ui`
- Latest commit at handoff: `caf4dec Add hosted QR sheet and audit maintenance tooling`
- Live PWA: `https://beaudown.github.io/rabbit-custom-creations-ui/`
- Hosted QR sheet: `https://beaudown.github.io/rabbit-custom-creations-ui/qr-launch-sheet.html`
- Creation manifest: `https://beaudown.github.io/rabbit-custom-creations-ui/creation-skill/manifest.json`
- Lease pairing target: `https://beaudown.github.io/rabbit-custom-creations-ui/broker/lease-pairing.json`
- Final verified GitHub Pages run: `31861074785`

All four hosted URLs returned HTTP 200 after the final push.

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

1. `/Users/z3k3z/Documents/AgentSharedMemory/shared/SOURCE-OF-TRUTH.md`
2. `/Users/z3k3z/Documents/AgentSharedMemory/shared/session-index.json`
3. Latest relevant snapshot under:
   `/Users/z3k3z/Documents/AgentSharedMemory/shared/snapshots/`
4. This file:
   `/Users/z3k3z/Documents/Omi Dev Space/rabbit-custom-creations-ui/docs/HERMES-HANDOFF.md`
5. Current project status log:
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
- `scripts/export-broker-sync.mjs`
- `scripts/manage-audit-log.mjs`
- `scripts/validate-superuser-package.mjs`

Tests:

- `tests/audit-management.test.mjs`
- `tests/mac-broker-handshake.test.mjs`
- `tests/package-readiness.test.mjs`
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
```

The broker binds to `http://127.0.0.1:8792` by default. Rabbit cannot reach
that loopback endpoint from the hosted PWA. Exposing the broker to LAN/Tailscale
is a separate later decision.

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
- `npm test` with localhost permission, 22/22 passing
- GitHub Pages deployment run `31861074785`
- HTTP 200 for PWA, QR sheet, Creation manifest, and lease pairing target

Local repo status at handoff:

```text
main...origin/main clean
```

No broker process was left running on `127.0.0.1:8792`.

## What Hermes Should Do Next

First safe task:

1. Confirm the GitHub URLs still load.
2. Ask the user to scan/open the hosted QR sheet.
3. Have the user open the PWA on Rabbit.
4. Record exact Rabbit behavior:
   - page loads
   - blank screen
   - unsupported browser/page
   - QR scan failure
   - text/layout issue
   - manifest import issue
   - cache/readiness result
5. Update GitHub docs and shared memory with the result.

Do not start live device-affecting tests until the user gives separate explicit
live authorization at action time.

