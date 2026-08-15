# Rabbit-Native Broker Plan

The target broker should run on the Rabbit r1 itself so the user can make
Creation-side requests while away from the MacBook.

## Desired Split

```text
Rabbit Custom Creation
  -> calls local Rabbit broker API
  -> broker validates request and checks live state
  -> broker reads GitHub-hosted manifests/prompts/templates
  -> broker approves, denies, or queues action
  -> broker writes audit record
```

The Creation is the caller. The broker is the decider/executor. GitHub is data
and audit storage.

The Mac local broker is a fallback/bootstrap coordinator. It can help bring up
the Rabbit-native broker in a lab setting, but the Rabbit-native broker is the
target runtime for walking around with the R1 whether local or remote.

## Current Status

Not implemented or installed on the Rabbit. The project currently contains:

- UI and Creation import pack.
- Request templates.
- Audit policy.
- Rabbit-native broker specification.
- Mac local fallback broker scaffold and coordination manifest.

It does not contain a validated on-device service, root payload, ADB enablement,
or install path.

## Broker Requirements

- Run on the Rabbit, not the MacBook.
- Be reachable by the local Creation.
- Optionally expose a remote request endpoint if authenticated and explicitly
  enabled.
- Pull GitHub manifests and request templates.
- Validate action allowlist, risk, approval, restart-scoped session state, and
  persistence policy.
- Support approve/deny.
- Record every request and result in the audit log.
- Preserve OTA eligibility by default.
- Treat persistent changes, flashing, erasing, and slot changes as blocked by
  default.

## Privileged Request Classes

- Temporary superuser session request.
- ADB over USB enable request.
- ADB over TCP/IP enable request.
- Normal reboot request.
- Recovery reboot request.
- Fastboot reboot request.
- USB storage discovery/exposure request.
- APK canary request.

Each class is a request type. Execution requires a future validated Rabbit-side
implementation and live checks.

## Temporary Privilege Lifetime

Temporary superuser/root state is modeled as restart-scoped, not wall-clock
scoped. Initial live authorization happens after a device restart. After the Mac
fallback broker coordinates bootstrap, the Rabbit-native broker may use the
validated temporary state until the next restart. Reboot is the expiry and
rollback boundary.

## Open Implementation Gap

The missing piece is a validated, OTA-safe way to install and run this broker on
rabbitOS 2.3 with the required privileges. Until that exists, the Creation can
prepare requests and GitHub can store data, but no on-device elevated action can
truthfully be marked live.
