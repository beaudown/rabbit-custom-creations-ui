---
name: rabbit-custom-creation-local-qr
description: Create Rabbit r1 Custom Creation install QR payloads and local-only QR artifacts from hosted, LAN, or tailnet app URLs without uploading QR images or embedding secrets. Use when building, validating, or handing off Rabbit Creation QR generation for Codex, Hermes, or OpenClaw.
---

# Rabbit Custom Creation Local QR

Use this skill when a Rabbit r1 Custom Creation needs a scannable install QR,
especially when the QR image must stay local and must not be uploaded to
GitHub or a third-party QR service.

## Required Rule

Rabbit's `Creations > add via QR` scanner expects a JSON object encoded inside
the QR. Do not encode a plain app URL, manifest URL, lease-pairing URL, route
test URL, broker endpoint, or dependency file URL and call it a Creation QR.

The QR payload must use only these top-level fields:

```json
{
  "title": "A1 Broker Test",
  "url": "https://example.ts.net/rabbit-custom-creations-ui/?creation=A1BrokerTestV3",
  "description": "Short user-facing purpose and first safe action.",
  "iconUrl": "https://example.ts.net/rabbit-custom-creations-ui/favicon.svg",
  "themeColor": "#FE5000"
}
```

The `url` points to the actual Creation app entrypoint. Dependency files,
manifests, broker metadata, and assets are loaded by that app from reachable
URLs; they are not the install QR payload.

## Workflow

1. Confirm the app URL and icon URL are reachable from the Rabbit network path:
   GitHub Pages, LAN, or Tailscale/private gateway.
2. Keep the QR artifact local when requested. Store it under `/private/tmp`,
   a local ignored output folder, or a handoff folder that will not be pushed.
3. Generate the QR with `scripts/create_local_creation_qr.mjs`.
4. Review the generated `.creation.json` before sharing the QR.
5. Scan the `.png` from the Rabbit r1 Creation QR scanner.
6. If Rabbit says it is not a valid custom creation, inspect the QR payload
   first. It must be JSON with the five required fields above.

## Tool

Run from this skill directory or from the repository root:

```bash
node skills/rabbit-custom-creation-local-qr/scripts/create_local_creation_qr.mjs \
  --title "A1 Broker Test" \
  --url "https://michaels-macbook-pro.tailcfaeac.ts.net/rabbit-custom-creations-ui/?creation=A1BrokerTestLocal" \
  --description "Testing-only Rabbit r1 broker route check. Run Step 1 and Step 2 only." \
  --icon-url "https://michaels-macbook-pro.tailcfaeac.ts.net/rabbit-custom-creations-ui/favicon.svg" \
  --theme-color "#FE5000" \
  --out "/private/tmp/rabbit-creation-qr"
```

Outputs:

- `<name>.creation.json` - exact Rabbit install payload.
- `<name>.payload.txt` - one-line JSON encoded into the QR.
- `<name>.qr.png` - local-only QR image for Rabbit scanning.
- `<name>.scan.html` - simple local review page.

## Safety Gates

Hard stop if any payload or URL contains token, secret, password, authorization,
relay token, session token, `x-rabbit-relay-token`, `sk-`, a local filesystem
path, or any root/ADB/fastboot/flash/install command.

For local-only use, prefer a private HTTPS URL that the Rabbit can reach, such
as Tailscale Serve or the Rabbit gateway route. Do not place credentials in the
QR. If auth is required, the Creation app should ask the user to enter the token
manually or retrieve it through an approved broker flow.

Read `references/custom-creation-qr-contract.md` before changing this skill or
debugging a rejected QR.
