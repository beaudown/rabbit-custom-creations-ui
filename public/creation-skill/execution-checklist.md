# Superuser Management Execution Checklist

Show this checklist before queueing or approving a request. If a required item
is missing, stop at the matching blocker and keep the request as a dry run.

## Hosted Manifest Ready

- Required for: import tool, start safe request.
- Dependencies: `creation-skill/manifest.json`, `broker/sync-manifest.json`,
  `broker/gateway-topology.json`, `broker/walkthrough-guide.json`.
- Evidence: HTTP 200 and valid JSON.
- Blocks if missing: the Creation cannot know available tools, routes, or guide
  order.

## Gateway Topology Ready

- Required for: broker pairing, elevated dry run, current-boot SU approval.
- Dependencies: Rabbit bridge, Rabbit-native broker spec, Rabbit gateway
  connector, OpenClaw gateway context, Hermes gateway context, Mac fallback
  broker.
- Evidence: `broker/gateway-topology.json` lists each role and labels gateway
  claims as context unless backed by evidence.
- Blocks if missing: the tool cannot route requests or explain which component
  owns a response.

## Lease Pairing Ready

- Required for: broker pairing, safe request setup, elevated dry run.
- Dependencies: `broker/lease-pairing.json`, `broker/broker-coordination.json`,
  active lease or explicit no-live-executor state.
- Evidence: connector-readable metadata, visible 72-hour policy, and lease
  actions reporting `superuserSessionAffected=false`.
- Blocks if missing: execution-result ownership is ambiguous.

## Request Template Ready

- Required for: safe request setup, elevated dry run, current-boot SU approval.
- Dependencies: request template, prompt variables, `request_id`,
  `device_state`, `broker_id`, and `approval_decision`.
- Evidence: template validates, variables are filled, and request preview has no
  missing required variables.
- Blocks if missing: the broker cannot safely map the user outcome to an
  allowlisted action.

## Dry-Run Result Ready

- Required for: current-boot SU approval.
- Dependencies: queued or blocked response, audit record or queue path, no
  device change.
- Evidence: broker returns `queued`, `blocked`, `yielded`, or
  `missing-live-check`; dry run shows `privilegedExecutionPerformed=false`.
- Blocks if missing: live approval would be blind and should not continue.

## Live Device Gate Ready

- Required for: current-boot SU approval.
- Dependencies: explicit user approval, fresh device state check, validated
  broker executor, current boot cycle, rollback or inspection note.
- Evidence: approval is recorded, device state is current, broker identity is
  current, and action is allowlisted and non-persistent by default.
- Blocks if missing: no live elevated action should run.

## Audit Lookup Ready

- Required for: debug or rollback.
- Dependencies: `broker/audit-log.jsonl`, `broker/audit-manifest.json`, archive
  index after rollover.
- Evidence: request ID, artifact hash, broker ID, action, device state, or time
  is searchable.
- Blocks if missing: debugging must be labeled unknown rather than inferred.
