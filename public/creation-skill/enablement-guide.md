# Superuser Enablement Guide

Use this guide from the single Superuser Management Creation when enabling
temporary single-boot-cycle superuser access. The PWA should present this as an
interactive wizard with one step visible at a time.

This guide is intentionally step-by-step. If any step is missing or unclear,
stay in dry-run or guide-only mode.

## What This Enables

- A broker-approved request for temporary superuser access.
- Scope is the current boot cycle only.
- The temporary state should clear on Rabbit restart.
- The Creation remains the caller and UI.
- The broker remains the validator, approver, executor, and audit writer.

## What This Does Not Enable

- Persistent root.
- Flashing or partition changes.
- OTA-breaking modification by default.
- Creation-side direct root execution.
- GitHub-side root execution.
- Automatic activation of uploaded skill hooks.

## Wizard Step 1: Open The Single Creation

1. Launch the Superuser Management Custom Creation.
2. Open or embed the hosted PWA.
3. Run **First Run / Readiness Check**.
4. Confirm launcher files, guides, templates, and offline cache are ready.

Expected result: the readiness panel reports launcher assets ready and either
broker reachable or guide-only/offline mode.

Stop if: launcher files, guide files, or templates are missing.

Wizard check: `readinessComplete`.

## Wizard Step 2: Detect Broker Route

1. Open **Bridge Routing**.
2. Confirm the broker endpoint.
3. Tap **Detect broker bridge**.
4. Read route target, expected output, blockers, and ADB status.

Expected result: route target is either Mac fallback broker or Rabbit on-device
broker.

Stop if: route target is unknown or the broker claims privileged execution
without an audit record.

Wizard check: `routeTargetKnown`.

## Wizard Step 3: Check Service Control

1. Open **Service Control**.
2. Run `status`.
3. Confirm bridge status and Rabbit on-device broker status.
4. Use `refresh_routes` before any start, stop, or restart request.

Expected result: service control returns dry-run or confirmed status with an
audit ID.

Stop if: a service action claims start, stop, restart, or privilege without
broker approval and audit evidence.

Wizard check: `serviceStatusChecked`.

## Wizard Step 4: Prepare Temporary SU Request

1. Open **Prompt Guide**.
2. Select **Temporary SU Bootstrap**.
3. Fill:
   - `request_id`
   - `device_state`
   - `broker_id`
   - `lease_holder`
   - `approval_decision`
   - `rollback_note`
4. Keep `dryRun=true`.
5. Queue the request.

Expected result: broker returns queued, blocked, yielded, or missing-live-check.
No device change happens during dry run.

Stop if: required variables are missing or dry run does not show
`privilegedExecutionPerformed=false`.

Wizard check: `requiredVariablesFilled`.

## Wizard Step 5: Live Authorization Gate

Only continue after the broker and user both confirm:

- current device state is fresh
- broker identity is current
- request is allowlisted
- rollback note is visible
- user approval is explicit
- session is restart-scoped
- persistent changes are blocked by default

Expected result: the broker records approval and shows the exact allowed action.

Stop if: the action would persist by default, affect OTA eligibility, change
slots, flash, erase, or bypass approval.

Wizard check: `approvalReady`.

## Wizard Step 6: Use Current-Boot Access

1. Execute only allowlisted workflows.
2. Keep each action separate.
3. Record an audit ID for each action.
4. Use audit lookup after each meaningful change.

Expected result: each action records request, decision, route, result, changed
items, and rollback clues.

Stop if: the device restarts. Restart clears the temporary session and requires
a fresh enablement pass.

Wizard check: `auditReady`.

## Wizard Step 7: Disable Or Recover

1. Reboot Rabbit to clear temporary current-boot state.
2. Open **Audit + rollback**.
3. Search by request ID, broker, route target, action, artifact hash, device
state, or time.
4. Follow the latest rollback or inspection note.

Expected result: logs explain what happened and what to inspect next.

Stop if: no matching audit evidence exists; label the result unknown instead of
guessing.

Wizard check: `blockersReviewed`.

## Wizard Output

The wizard should generate a dry-run request summary with:

- `action=request_temporary_privilege_session`
- `dryRun=true`
- `expectedScope=current_boot_cycle_ram_only_until_restart`
- `persistenceExpected=false`
- readiness, route, service, variables, approval, audit, and blocker checks

Do not allow the wizard to claim temporary SU is active. It may only show that
the enablement request is ready for broker dry run or explicit live approval.
