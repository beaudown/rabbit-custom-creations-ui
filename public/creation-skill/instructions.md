# Rabbit Broker Workflow

Use this skill inside a Rabbit custom Creation to request broker-backed
developer workflows.

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

## Request steps

1. Ask the user which workflow they want.
2. Show the risk level and required checks.
3. Default to dry run.
4. Create the matching broker request template.
5. Send or expose the request for the Mac/OpenClaw broker.
6. Wait for broker approval/deny/result.
7. Show the audit record ID.
8. If something breaks, search active and archived audit logs by action, tag,
   time, device state, artifact hash, or rollback note.

## Escalated privilege language

Use the phrase "Creation-side escalated privilege request" for root/superuser
flows. The Creation is the caller. The broker is the executor. Temporary
privilege should expire by TTL or reboot and should avoid persistent changes by
default.
