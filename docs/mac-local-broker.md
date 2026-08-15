# Mac Local Fallback Broker

The Mac broker is a fallback coordinator for lab and bootstrap work. It shares
the same GitHub-visible request templates, coordination manifest, and audit log
as the Rabbit-native broker plan, but it is not the final always-available
runtime.

## Role

- Register Mac broker presence in `public/broker/broker-coordination.json`.
- Hold a 24-hour lease before writing execution results.
- Queue or deny requests using the same policy fields as the Rabbit broker.
- Write audit records to `public/broker/audit-log.jsonl`.
- Coordinate bootstrap requests for a future Rabbit-native broker.
- Act as the lab fallback authority when the Rabbit broker is not installed,
  not privileged, or not reachable.
- Use the shared prompt library to explain variables and next steps before
  accepting a request.
- Write accepted requests to `public/broker/queue/inbox/{requestId}.json`.
- Serve `GET /sync/manifest` and `GET /sync/export` for queue-aware clients.

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

For temporary superuser/root workflows, the intended lifetime is until the next
Rabbit restart. The Mac fallback broker may coordinate the initial restart-time
authorization, then the Rabbit-native broker becomes the local caller for
allowed privileged operations while that restart-scoped state exists.

After this bootstrap, the Rabbit-native broker should not require the Mac broker
to stay reachable. If the Rabbit broker can renew or hold its own 24-hour lease,
it remains the active local authority until restart, explicit denial, or lease
replacement by a validated policy.

## Lease Behavior

Only the active lease holder may write execution results. The default lease is
24 hours. If the Rabbit-native broker is live and holding the lease, the Mac
broker must yield. If no Rabbit broker is present, the Mac broker may hold the
lease for request intake, approval state, audit logging, and bootstrap
coordination.

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
