# Rabbit Broker Workflow

Use this skill inside a Rabbit custom Creation to request broker-backed
developer workflows.

Keep broker management inside one Superuser Management Creation/tool with
nested modules for superuser actions, prompts, requests, queue, lease, logs,
device workflows, and settings.

This tool includes the Rabbit on-device broker and the bridge to that broker.
It should also read the Rabbit gateway connector, OpenClaw gateway, and Hermes
gateway roles from `broker/gateway-topology.json` when explaining routing or
handoff state.

When the user wants to provoke a specific response or expected outcome, read
`walkthrough-guide.md` and `broker/walkthrough-guide.json` first. Show the
do-first step, expected broker response, next action, and stop condition before
queueing a request.

## What this Creation may do

- Open prompt and file libraries from GitHub.
- Generate QR links for hosted files, prompts, and request templates.
- Create broker requests for temporary superuser, root, or escalated privilege
  sessions.
- Create broker requests for ADB enable preparation, normal reboot, fastboot
  reboot, recovery reboot, USB mass-storage or supported storage exposure,
  storage export, APK canary, and device-state checks.
- Show approve/deny steps before any privileged action.
- Show audit log status and archive search hints.
- Show the broker prompt library with each prompt's purpose, variables, where
  values come from, and what those values mean.
- Show the GitHub sync contract, including queue inbox/outbox paths, request
  states, and the export bundle path.
- Show a step-by-step actionable flow with the exact button/action to use and
  the expected outcome before a privileged request is queued.
- Show the response playbook for import, broker pairing, safe request setup,
  elevated dry run, current-boot SU approval, and audit/rollback lookup.
- Show the gateway mesh: Rabbit bridge, Rabbit on-device broker, Rabbit gateway
  connector, OpenClaw gateway, Hermes gateway, Mac fallback broker, and GitHub
  storage.
- Explain that broker leases default to 72 hours and that Rabbit-native broker
  operation should not depend on Mac reachability after bootstrap.
- Explain that lease expiry only affects shared result-writing ownership; it
  must not revoke a validated Rabbit-local current-boot temporary superuser
  session.
- Explain that lease pairing metadata lives at `broker/lease-pairing.json` and
  should be retrieved automatically by the Rabbit connector. QR pairing is a
  fallback.

## What this Creation must not claim

- Do not claim the Creation itself executed root.
- Do not claim GitHub executed root.
- Do not claim ADB, fastboot, recovery, or storage export succeeded before the
  broker logs a confirmed result.
- Do not claim Rabbit storage can be mounted by USB mass storage until the
  broker discovers and confirms a supported exposure mode.
- For USB storage workflows, ask the broker to discover Android file transfer,
  recovery mount options, MediaTek/Preloader-visible storage, read-only export,
  or USB mass-storage mode if supported by the live device.
- Do not store secrets or tokens in GitHub files.
- Do not allow a gateway claim from OpenClaw or Hermes to override the active
  broker lease or live device authorization requirement without evidence.

## Request steps

1. Ask the user which workflow they want.
2. Show the risk level and required checks.
3. Suggest one or more prompt-library entries and explain required variables.
4. Default to dry run.
5. Create the matching broker request template.
6. Send or expose the request for the Rabbit-native or Mac fallback broker.
7. If GitHub sync is enabled, write or point to the queue inbox file for that
   request ID.
8. Wait for broker approval/deny/result.
9. Show the audit record ID and queue path.
10. If something breaks, search active and archived audit logs by action, tag,
   time, device state, artifact hash, or rollback note.

## Escalated privilege language

Use the phrase "Creation-side escalated privilege request" for root/superuser
flows. The Creation is the caller. The broker is the executor. Temporary
privilege is restart-scoped: initial live authorization should happen after a
device restart, and the temporary state should clear on the next restart. It
should avoid persistent changes by default.
