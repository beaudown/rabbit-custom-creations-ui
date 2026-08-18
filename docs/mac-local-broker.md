# Mac Local Fallback Broker

The Mac broker is a fallback coordinator for lab and bootstrap work. It shares
the same GitHub-visible request templates, coordination manifest, and audit log
as the Rabbit-native broker plan, but it is not the final always-available
runtime.

## Role

- Register Mac broker presence in `public/broker/broker-coordination.json`.
- Hold a 72-hour lease before writing execution results.
- Queue or deny requests using the same policy fields as the Rabbit broker.
- Write audit records to `public/broker/audit-log.jsonl`.
- Coordinate bootstrap requests for a future Rabbit-native broker.
- Act as the lab fallback authority when the Rabbit broker is not installed,
  not privileged, or not reachable.
- Use the shared prompt library to explain variables and next steps before
  accepting a request.
- Write accepted requests to `public/broker/queue/inbox/{requestId}.json`.
- Serve `GET /sync/manifest` and `GET /sync/export` for queue-aware clients.
- Serve `GET /actions/catalog` and `POST /actions` as the single control and
  warning surface for risky broker workflows.
- Serve lease manager actions: `POST /lease/refresh`, `POST /lease/renew`, and
  `POST /lease/release`.
- On every new broker startup, close or yield the previous broker route and
  clear stale transient broker configuration before accepting requests.

## Non-Role

- It does not contain a root payload.
- It does not silently escalate privileges.
- It does not override an active Rabbit-native broker lease.
- It does not make OTA-breaking persistent changes.
- It is not available when the MacBook is off.

## Bootstrap Boundary

The Mac broker can be the initial authority that helps approve and coordinate a
Rabbit-native broker install path, APK canary, or temporary privilege request.
It still records those actions as requests until there is a separate live device
authorization and a validated execution mechanism.

`POST /actions` is the controller-of-record for high-risk requests. It classifies
the requested action, returns expected outcomes, warnings, blockers, route
target, and stop reason, then writes an audit record and queue file. Current Mac
fallback builds do not execute privileged actions from this endpoint. They stop
before execution unless a Rabbit-native broker is installed, reachable,
execution-capable, exact-build validated, live-device verified, and separately
approved for the exact action.

For temporary superuser/root workflows, the intended lifetime is until the next
Rabbit restart. The Mac fallback broker may coordinate the initial restart-time
authorization, then the Rabbit-native broker becomes the local caller for
allowed privileged operations while that restart-scoped state exists.

After this bootstrap, the Rabbit-native broker should not require the Mac broker
to stay reachable. The Rabbit broker's current-boot temporary superuser
capability is separate from the shared broker lease. A lease expiry can affect
who writes shared queue/execution-result records, but it must not turn off the
Rabbit-local RAM/current-boot superuser session.

## Lease Behavior

Only the active lease holder may write execution results. The default lease is
72 hours. If the Rabbit-native broker is live and holding the lease, the Mac
broker must yield. If no Rabbit broker is present, the Mac broker may hold the
lease for request intake, approval state, audit logging, and bootstrap
coordination. This lease does not gate Rabbit-native temporary superuser access
after bootstrap.

The Mac broker regenerates lease pairing metadata on startup or when it becomes
available again. Rabbit should retrieve `broker/lease-pairing.json` through its
connector automatically; the QR is a fallback pairing route.

Lease manager actions affect shared ownership/result-write coordination only.
They must not revoke or alter Rabbit-local current-boot temporary superuser
state after bootstrap.

## Startup Cleanup

Starting a new broker must not inherit stale route, endpoint, presence, pending
service-control, or capability-detection state from a previous broker. The
startup sequence must close or yield the previous broker route, clear those
transient fields, write cleanup evidence into audit, then reacquire or renew
lease ownership as appropriate.

The cleanup must preserve audit history, queue files, rollback records,
published templates, and Rabbit-local current-boot superuser state. Lease or
broker cleanup is not a Rabbit reboot and must not be represented as clearing
or granting superuser access.

## Start Locally

```bash
npm run broker:mac
```

Default local API:

```text
http://127.0.0.1:8792
```

Health check:

```bash
curl http://127.0.0.1:8792/health
```

The service writes local repository files only. Pushing those files to GitHub is
a separate user-approved step.

## GitHub Sync

The Mac fallback broker follows `public/broker/sync-manifest.json`. It may write
queued request files and audit records locally, then a separate user-approved
GitHub push can publish those files. The Mac broker must not treat GitHub as an
executor; GitHub is only shared storage for broker-readable state.
