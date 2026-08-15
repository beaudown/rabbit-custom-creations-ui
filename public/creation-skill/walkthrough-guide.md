# Superuser Management Walkthrough

Use this order when the user wants a specific response or expected outcome.
Show the expected response and stop condition before queueing anything.

## 1. Import the tool

- Do first: scan the Creation skill QR or open `creation-skill/manifest.json`.
- Expect: Superuser Management opens with gateway mesh, prompt guide, queue
  paths, and audit links.
- Next: verify `broker/gateway-topology.json` and `broker/sync-manifest.json`.
- Stop if: the manifest, topology, or sync contract cannot load.

## 2. Pair brokers

- Do first: use Reconnect from QR or let the Rabbit connector read
  `broker/lease-pairing.json`.
- Expect: 72-hour ownership metadata appears and states lease actions do not
  affect Rabbit-local current-boot SU.
- Next: refresh or renew only if result-writing ownership needs to move.
- Stop if: lease pairing is missing, stale, or not connector-readable.

## 3. Start a safe request

- Do first: pick the workflow from the prompt guide.
- Expect: the Creation maps the outcome to a request template and required
  variables.
- Next: fill `request_id`, `device_state`, `broker_id`, `lease_holder`, and
  `approval_decision`.
- Stop if: required variables are missing or the broker route is not eligible.

## 4. Dry-run elevated action

- Do first: queue as dry run.
- Expect: broker returns `queued`, `blocked`, `yielded`, or
  `missing-live-check` without changing the device.
- Next: continue only when route, live checks, and approval state are correct.
- Stop if: any component claims execution without an audit record.

## 5. Approve current-boot SU

- Do first: approve live only after the required restart and live checks.
- Expect: Rabbit-native broker may handle allowlisted current-boot actions until
  the next restart.
- Next: execute only the selected allowlisted workflow and record the audit ID.
- Stop if: the device restarted, broker is not validated, or the action would
  persist by default.

## 6. Debug or roll back

- Do first: search active and archived audit logs.
- Expect: logs identify request, broker, decision, artifact hashes, result,
  changed items, and rollback clues.
- Next: search by request ID, artifact hash, broker ID, action, device state, or
  time.
- Stop if: no matching audit evidence exists; label the result as unknown.
