# Rabbit-Native Broker Plan

The target broker should run on the Rabbit r1 itself so the user can make
Creation-side requests while away from the MacBook.

The user-facing surface should be one Superuser Management Creation/tool.
Superuser actions, prompts, request composition, queue browsing, lease pairing,
audit logs, USB/ADB/reboot workflows, and settings should be nested modules
inside that console rather than separate tools the user has to jump between.

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
- Load the prompt library and explain each suggested prompt, required variable,
  value source, and value meaning before queueing a request.
- Present a step-by-step action flow with the concrete UI action to take and
  the expected outcome for import, pairing, workflow selection, dry run,
  authorization, and audit review.
- Read `public/broker/sync-manifest.json` so Rabbit and Mac brokers agree on
  queue folders, request states, and export shape.

## Contextual Prompt Walkthrough

The Creation should read `public/broker/prompt-library.json` before asking the
user to approve a broker workflow. Each prompt entry describes what the prompt
does, what variables it needs, where those values come from, and why those
values matter.

The prompt guide is not just a list of commands. It should help the user answer:

- Which broker should handle this request?
- What state is the Rabbit currently in?
- Which request template is being used?
- Which broker holds the lease?
- What approval decision and rollback note will be logged?

## GitHub Sync

The Rabbit-native broker should read the same sync manifest as the Mac fallback
broker. GitHub may provide request files, prompt packs, templates, exports, and
audit history. GitHub must not be treated as a privileged executor. Execution
result files are written only by the active broker lease holder.

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

This current-boot temporary superuser state is independent of Mac reachability
after bootstrap and independent of broker lease expiry. The Rabbit-native broker
should eventually expose the approved common root/superuser tool set locally for
the current boot cycle, even when fully remote.

## Open Implementation Gap

The missing piece is a validated, OTA-safe way to install and run this broker on
rabbitOS 2.3 with the required privileges. Until that exists, the Creation can
prepare requests and GitHub can store data, but no on-device elevated action can
truthfully be marked live.

## Lease Duration

Broker leases default to 72 hours. The lease controls which broker may write
execution results; it does not control whether the Rabbit-native broker can call
the current-boot temporary superuser facility. Temporary privilege remains
restart-scoped and clears on Rabbit restart.

The Mac fallback broker is expected to bootstrap the Rabbit-native broker
initially. After that, the Rabbit-native broker should be able to call/request
temporary access locally and continue operating while fully remote, without
requiring the Mac broker to be reachable.

The Rabbit connector should automatically retrieve `broker/lease-pairing.json`
when pairing broker ownership. QR pairing exists for fallback/manual recovery.
The custom Creation should expose reconnect, refresh, release, and renew actions
for this pairing data. Those actions affect shared ownership/result-writing
only, not Rabbit-local current-boot temporary superuser state.
