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
- Broker audit panel with append-only GitHub JSONL log design, 4,000 active
  record target, 3,000 record warning threshold, archive chunks, and no-secrets
  rule.

## Broker audit log

The broker log is designed for debugging and rollback planning. It should record
every request, denial, dry run, approval, execution result, rollback attempt,
post-check, and session expiry.

Seed files:

- `public/broker/audit-manifest.json`
- `public/broker/audit-log.jsonl`
- `docs/broker-audit-log.md`

Retention policy:

- Keep up to 4,000 active JSONL records.
- Warn at 3,000 active records.
- Archive the oldest 1,000 records when the active log exceeds 4,000.
- Store archive metadata with line count, SHA-256, first/last record IDs, and
  time range.

Each record should identify what was requested, what was approved or denied,
what artifact hashes were used, what changed, whether the change persists after
reboot, and how to inspect or reverse it. Do not log secrets, credentials, raw
private transcripts, or tokens.

## Local development

```bash
npm install
npm run dev
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
