# GitHub Sync Contract

The sync layer is a file contract both brokers can read from GitHub. It keeps
request state portable without requiring GitHub Pages to execute anything.

## Paths

- `public/broker/sync-manifest.json`: authoritative path and rule manifest.
- `public/broker/queue/inbox`: queued request JSON files.
- `public/broker/queue/outbox`: broker results ready for sync.
- `public/broker/queue/processed`: completed request records.
- `public/broker/queue/dead-letter`: malformed or blocked request records.
- `public/broker/exports`: generated sync export bundles.

## Rules

- One request per file.
- File name is `{requestId}.json`.
- Request IDs must match `^[A-Za-z0-9._-]{3,96}$`.
- GitHub can store and sync requests, prompts, templates, logs, and exports.
- GitHub cannot execute privileged actions.
- Execution-result writes require the active broker lease.
- Audit records remain append-only and must not contain secrets.

## Export

Run:

```bash
npm run broker:export
```

The default output is:

```text
dist/broker-sync-export.json
```

The export includes the sync manifest, coordination state, prompt library,
request template names, queue indexes, and file hashes. It is useful for QR,
debugging, and future Rabbit-native broker bootstrap checks.
