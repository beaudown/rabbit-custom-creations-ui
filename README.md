# Rabbit Custom Creations UI

A compact, high-contrast Rabbit r1 web UI prototype for organizing custom
creations into reachable folders, sorting them, recategorizing them, and
confirming removal/uninstall actions.

## Features

- Dark, high-contrast visual system sized for compact touch screens.
- Default folder view for categories such as Media Tools, Developer Tools,
  Productivity, Device Utilities, AI Assistants, Experiments, Favorites, and
  future custom categories.
- Sort modes for category folders, newest installed, oldest installed, and
  name A-Z.
- Search, add/import affordance, settings affordance, category reassignment,
  and explicit remove confirmation.
- GitHub Pages QR panel for opening the hosted UI on Rabbit by scan.
- Broker audit panel with append-only GitHub JSONL log design, 1,500 active
  record target, 1,200 record warning threshold, archive chunks, and no-secrets
  rule.
- Importable Creation skill pack for Creation-side escalated privilege requests
  routed through the broker.
- QR/link panel for importing `creation-skill/manifest.json` into a Rabbit
  custom Creation.
- Rabbit-native broker specification for an always-available broker that does
  not depend on the MacBook being online.
- Mac local fallback broker scaffold for lab bootstrap coordination, shared
  GitHub-state awareness, and audit logging.
- Context-aware prompt library with variables, value sources, and meanings for
  guided broker walkthroughs.
- Interactive request composer that turns a selected prompt and filled
  variables into a dry-run broker request JSON preview.
- GitHub sync contract for shared broker queue folders, request states, and
  portable sync exports.

## Broker audit log

The broker log is designed for debugging and rollback planning. It should record
every request, denial, dry run, approval, execution result, rollback attempt,
post-check, and session expiry.

Seed files:

- `public/broker/audit-manifest.json`
- `public/broker/audit-log.jsonl`
- `docs/broker-audit-log.md`
- `public/creation-skill/manifest.json`
- `public/creation-skill/instructions.md`
- `public/creation-skill/settings.json`
- `public/broker/rabbit-native-broker-spec.json`
- `public/broker/remote-broker-config.json`
- `public/broker/broker-coordination.json`
- `public/broker/mac-local-broker-config.json`
- `public/broker/prompt-library.json`
- `public/broker/sync-manifest.json`
- `public/broker/queue/inbox`
- `public/broker/queue/outbox`
- `public/broker/queue/processed`
- `public/broker/queue/dead-letter`
- `docs/github-sync.md`
- `docs/rabbit-native-broker.md`
- `docs/remote-broker-topology.md`
- `docs/mac-local-broker.md`

Expected Creation skill manifest URL after GitHub Pages deployment:

```text
https://beaudown.github.io/rabbit-custom-creations-ui/creation-skill/manifest.json
```

Retention policy:

- Keep up to 1,500 active JSONL records.
- Warn at 1,200 active records.
- Archive the oldest 500 records when the active log exceeds 1,500.
- Store archive metadata with line count, SHA-256, first/last record IDs, and
  time range.
- Keep archives queryable with tags and summaries for debugging and rollback
  questions.

Each record should identify what was requested, what was approved or denied,
what artifact hashes were used, what changed, whether the change persists after
reboot, and how to inspect or reverse it. Do not log secrets, credentials, raw
private transcripts, or tokens.

## Local development

```bash
npm install
npm run dev
```

## Mac local fallback broker

The Mac broker is a local fallback and bootstrap coordinator. It shares the same
GitHub-visible coordination files and audit log as the Rabbit-native broker
plan, but it is not the final always-available broker because it requires the
MacBook to be online.

```bash
npm run broker:mac
```

Default local API:

```text
http://127.0.0.1:8792
```

It can record presence, acquire a 72-hour lease, queue/deny/approve requests, and
append audit records. Privileged execution remains disabled until a separate
live Rabbit authorization path is validated. Temporary privilege sessions are
modeled as restart-scoped: initial authorization after a device restart, then
expiry on the next restart.

After Mac fallback bootstrap, the Rabbit-native broker is expected to keep
working without Mac reachability for the current validated session. The broker
lease and the temporary privilege lifetime are separate: the lease defaults to
72 hours and only controls shared execution-result writes, while temporary
elevated state is Rabbit-local, RAM/current-boot scoped, independent of Mac
reachability after bootstrap, independent of lease expiry, and still clears on
Rabbit restart.

Lease pairing metadata is hosted at:

```text
public/broker/lease-pairing.json
```

The Rabbit connector should automatically retrieve that file when pairing broker
ownership. The QR code is a fallback/manual pairing affordance, not a root
payload.

The UI request composer can post a completed dry-run request to the Mac broker
at `http://127.0.0.1:8792/requests` when that broker is running.

Queued requests are written to:

```text
public/broker/queue/inbox/{requestId}.json
```

Generate a portable sync bundle:

```bash
npm run broker:export
```

Default output:

```text
dist/broker-sync-export.json
```

## Build

```bash
npm run build
```

The production site is emitted to `dist/`.

## GitHub Pages publishing

This repository includes `.github/workflows/deploy-pages.yml`. After pushing to
GitHub:

1. Open the repository settings.
2. Set Pages source to GitHub Actions.
3. Push `main` or run the deploy workflow manually.
4. Use the Pages URL as the Rabbit scan target.

Expected URL pattern:

```text
https://beaudown.github.io/rabbit-custom-creations-ui/
```

QR helper:

```text
https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=16&data=https%3A%2F%2Fbeaudown.github.io%2Frabbit-custom-creations-ui%2F
```

## Rabbit safety boundary

This project is only a hosted UI prototype. It does not issue Rabbit ADB,
fastboot, recovery, root, flash, install, boot-state, WebUSB, or WebSerial
commands. Any future uninstall/install behavior must be wired to a separately
authorized, explicitly gated device-management path.

Creation-side escalated privilege requests are supported as request records.
The Creation may call broker workflows for temporary privilege, ADB-enable
preparation, ADB TCP/IP preparation, reboot, recovery, fastboot, USB storage
exposure, and APK canary.
Execution remains broker-side after approval and live checks.

## Current broker status

Implemented:

- GitHub Pages UI.
- Creation import pack.
- Request templates.
- Audit policy and seed logs.
- Rabbit-native broker specification.
- Mac local fallback broker scaffold.
- Broker coordination manifest with single-writer lease policy.

Not implemented yet:

- A broker service installed/running on the Rabbit.
- Privileged execution.
- A validated OTA-safe install path for the on-device broker.
- A live remote API endpoint.

GitHub Pages is static. It can host the UI and files, but it cannot be the
always-on executor.
