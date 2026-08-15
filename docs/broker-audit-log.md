# Broker Audit Log Design

The Rabbit Creation and GitHub Pages UI are request surfaces only. The
Mac/OpenClaw broker is the executor and must write an audit record for every
request, denial, dry run, approval, execution attempt, rollback attempt, and
post-check.

## Storage

- Active log: `broker/audit-log.jsonl`
- Manifest: `broker/audit-manifest.json`
- Archive folder: `broker/archive/`
- Active retention target: 4,000 records.
- Warning threshold: 3,000 records.
- Archive chunk size: 1,000 records.

The active log is append-only JSON Lines. When the active log exceeds 4,000
records, the broker should move the oldest 1,000 records into a dated archive
file and update the manifest with the archive filename, line count, SHA-256,
first record ID, last record ID, and time range.

## Record Requirements

Each record must identify:

- What was requested.
- Who or what requested it.
- When it was requested, approved, started, and completed.
- Which device state was checked.
- Which GitHub artifacts were used and their hashes.
- Whether it was a dry run, approved run, denial, blocked action, rollback, or
  post-check.
- What changed, if anything.
- How to reverse or inspect the change.

No secret token, raw private transcript, or credential may be written to the
audit log. Store only request IDs, actor labels, artifact hashes, and redacted
paths.

## Event Kinds

- `request_created`
- `request_denied`
- `request_blocked`
- `dry_run_completed`
- `approval_granted`
- `execution_started`
- `execution_completed`
- `execution_failed`
- `rollback_started`
- `rollback_completed`
- `post_check_completed`
- `session_expired`

## Safety Rules

- Privileged actions require explicit approval per request.
- Approval expires after a short TTL.
- The broker must log blocked actions as blocked rather than successful.
- The broker must refuse arbitrary shell unless a separate high-risk mode is
  explicitly enabled.
- The broker must record live device identity before any device-affecting
  action.
- The broker must record whether an action is expected to persist after reboot.
- For low-level work, the broker must enforce the normal stock boot/shutdown
  reset gate recorded in the Rabbit handoff.

## Debugging Use

The log is meant to answer:

- What changed before a feature broke?
- Which artifact or prompt version was used?
- Was a request denied, blocked, dry-run only, or executed?
- Did the broker verify the expected device/build first?
- Was rollback attempted and did it complete?
- Did the device return to the expected clean state?
