---
name: rabbit-broker-workflow
description: Guide Rabbit r1 Creation plus GitHub Pages/storage plus Mac/OpenClaw broker workflows, including safe request planning, approval gates, audit logging, QR handoff, GUI requirements, and validation. Use when designing or updating Rabbit custom creations, broker request manifests, GitHub-backed prompt/file libraries, temporary-privilege request flows, or debugging/rollback audit trails.
---

# Rabbit Broker Workflow

## Core Boundary

Treat the Rabbit Creation and GitHub Pages UI as request/call surfaces. Treat
the Mac/OpenClaw broker as the only executor. A Creation may call workflows
such as ADB-enable, fastboot/recovery reboot preparation, storage export, APK
canary, or temporary privilege session. Call these Creation-side escalated
privilege requests, and route them as broker requests. Do not claim a Creation,
QR code, or GitHub-hosted page directly executes privileged commands by itself.

For temporary superuser work, plan a broker-managed session only. A validated
local non-persistent payload may be referenced by hash and compatibility
metadata, but the Rabbit Creation/GitHub page remains the requester rather than
the executor:

1. Verify live device identity, build, slot, connection, and fresh boot gate.
2. Validate a non-persistent access method for the exact build.
3. Generate a structured request.
4. Show approve/deny UI.
5. Enforce short TTL and action allowlist.
6. Log dry runs, approvals, blocks, execution, rollback, and post-checks.
7. Prefer no persistent change and require explicit exception text otherwise.

## Workflow

1. Read the Rabbit federation source and current project handoff before any
   Rabbit-specific implementation or report.
2. Classify the requested feature:
   - `safe-ui`: prompt/file library, QR launch, status display, settings.
   - `broker-request`: prepares a request but does not execute it.
   - `privileged`: requires broker approval, live checks, and validated access.
   - `blocked`: Creation-side/GitHub-side payload execution, arbitrary shell,
     flash/erase/slot changes, OTA-breaking permanent modification, or
     unvalidated root.
3. For UI work, update the GitHub Pages app first. Keep controls large,
   readable, dark, high contrast, and touch friendly.
4. For request work, create or update JSON manifests under `public/broker/`.
5. Run `scripts/validate_broker_request.py <request.json>` for request files.
6. Update audit docs and seed logs when the workflow changes.
7. Run the project tests before committing.

## GUI Requirements

Use a compact Rabbit-first interface:

- Large text, high contrast, and no tiny controls.
- 44 px minimum touch targets.
- Dark glass-like panels with clear borders and legible labels.
- Settings grouped by Broker, GitHub, Audit Log, Safety Gates, and Display.
- Buttons must describe intent: Request, Dry Run, Approve, Deny, Archive,
  Export, Verify, Open QR.
- Privileged actions must show risk, required checks, TTL, persistence, and
  rollback notes before approval.

## Audit Log Policy

Use append-only JSONL:

- Active log: `public/broker/audit-log.jsonl`
- Manifest: `public/broker/audit-manifest.json`
- Archive folder: `public/broker/archive/`
- Active retention target: 1,500 records.
- Warning threshold: 1,200 records.
- Archive chunk size: 500 records.

When the active log exceeds 1,500 records, archive the oldest 500 records into
a queryable chunk. Each archive entry must keep filename, line count, SHA-256,
first/last record IDs, time range, tags, and a short summary so rollback and
debugging questions can search archived history without restoring everything.

## Request Validation

Use `scripts/validate_broker_request.py` for broker request files. The validator
must reject:

- Creation-side or GitHub-side privileged execution that bypasses the broker;
- permanent software modification that would break OTA eligibility;
- arbitrary shell;
- flash, erase, slot change, or persistent root by default;
- privileged actions without explicit approval and live checks;
- missing rollback notes on medium/high risk actions;
- any secret-looking values.

Read `references/broker-workflow.md` when implementing a new request kind or
changing audit retention behavior.
