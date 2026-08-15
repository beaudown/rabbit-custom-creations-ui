# Remote Broker Topology

The Rabbit Creation can call broker workflows from anywhere, but the broker
executor cannot be only a Mac-local process if the MacBook may be off.

## What GitHub Can Do

- Host the GitHub Pages UI.
- Host the Creation import pack.
- Host request templates, prompt packs, file manifests, and documentation.
- Store audit snapshots and archived JSONL logs.
- Trigger slow/background workflows when an authenticated system calls GitHub
  Actions.

GitHub Pages cannot run an always-on HTTP broker or execute device actions.

## Remote Broker Options

1. **Cloudflare Worker or Vercel Function**
   - Best fit for always-reachable request intake, validation, hints, and audit
     forwarding.
   - Can receive Rabbit Creation calls while the MacBook is off.
   - Cannot execute Rabbit-local privileged actions unless the Rabbit or another
     online device calls back.

2. **Rabbit-native broker service**
   - Best fit for walking around with only the Rabbit.
   - Requires a validated way to run a local service on the Rabbit.
   - Must remain OTA-safe by default and avoid persistent system modification
     unless separately approved.

3. **VPS or hosted container**
   - Good for durable queueing and richer approval UI.
   - Still needs a live executor near the Rabbit or running on the Rabbit.

4. **Mac/OpenClaw broker**
   - Good for lab work, fallback coordination, and bootstrap work.
   - Can share GitHub request, dependency, presence, lease, and audit files.
   - Not acceptable as the only production broker if the MacBook may be off.

## Recommended Split

```text
Rabbit Creation
  -> GitHub Pages UI and import pack
  -> Remote broker intake API
  -> GitHub-backed request/audit storage
  -> Rabbit-native executor when available
  -> Mac local fallback broker for lab/bootstrap support
```

## Execution Boundary

The remote broker may validate, queue, approve, deny, and log requests. It
should not claim a root/ADB/reboot/storage action succeeded until a live
Rabbit-side or device-adjacent executor confirms the result.

## Coordination Boundary

Rabbit-native broker and Mac local broker must use the same coordination
manifest. Only the active lease holder writes execution results. The Rabbit
broker is preferred whenever it is running and validated. The Mac broker yields
to the Rabbit broker and acts as fallback/bootstrap authority only when the
Rabbit broker is absent, not installed, or not yet privileged.

Leases default to 24 hours. This is long enough for a full development day while
still giving the system a clear ownership boundary. The Rabbit-native broker may
renew or retain its lease after Mac bootstrap so the Rabbit remains useful when
fully remote.

## Sync Contract

Both brokers also use `public/broker/sync-manifest.json` for queue paths and
request states. The shared inbox path is `public/broker/queue/inbox`; each
request is stored as one JSON file named by request ID. Remote GitHub storage can
move requests between systems, but cannot execute or confirm privileged actions.

## Remote Safety Defaults

- Remote ADB-enable request: allowed as request, execution requires live device
  check.
- Remote reboot/recovery/fastboot request: allowed as request, execution
  requires live device check.
- Remote USB storage request: discovery-first; do not assume true mass storage.
- Remote flashing: blocked by default unless a local computer is connected and
  a separate high-risk policy explicitly enables it.
- Persistent root or OTA-breaking modification: blocked by default.
