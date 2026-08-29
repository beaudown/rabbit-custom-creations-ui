# Rabbit Custom Creation QR Contract

## Install Payload

A scannable Rabbit r1 Custom Creation QR contains a JSON object, not a URL.
The object has exactly five top-level keys:

- `title`
- `url`
- `description`
- `iconUrl`
- `themeColor`

The safest key order is the order above. The QR generator in this skill writes
that order intentionally.

## What The URL Should Be

`url` is the launch surface Rabbit opens after installation. Valid examples:

- GitHub Pages app URL:
  `https://beaudown.github.io/rabbit-custom-creations-ui/?creation=A1BrokerTestV3`
- Private tailnet app URL:
  `https://michaels-macbook-pro.tailcfaeac.ts.net/rabbit-custom-creations-ui/?creation=A1BrokerTestLocal`
- LAN HTTPS or HTTP app URL, only when the Rabbit can reach that host.

The app loaded from `url` may then fetch dependency files such as:

- `/creation-skill/manifest.json`
- `/broker/lease-pairing.json`
- `/broker/actions/catalog`
- `/assets/...`

Those dependency URLs must be reachable by the Rabbit, but they are not the QR
payload by themselves.

## What Must Not Be Encoded

Never encode these as a Rabbit Creation install QR:

- Plain GitHub Pages URL alone.
- Manifest URL.
- Lease-pairing URL.
- Broker route URL.
- Relay health route.
- QR sheet URL.
- A URL containing tokens or headers.
- A one-time session token.
- A file path such as `/private/tmp/...`.
- A command, root payload, ADB action, fastboot action, or flash/install step.

## Local-Only QR Meaning

Local-only means the QR artifact image and payload files are generated and kept
on this Mac. It does not mean Rabbit can load `file://` paths. The Rabbit still
needs network-reachable `url` and `iconUrl` values.

Use local-only QR generation when:

- The Creation app is served privately over Tailscale or LAN.
- The QR image should not be committed, pushed, or uploaded.
- The QR payload must be reviewed before the user scans it.

## Validation Checklist

Before giving the QR to the user:

1. Open `<name>.creation.json` and confirm it has only the five required keys.
2. Confirm `url` and `iconUrl` are absolute `https://` or approved `http://`
   URLs reachable by the Rabbit.
3. Confirm no token/header/secret appears in the JSON, URL query string, docs,
   generated HTML, or logs.
4. Confirm the local QR image is `<name>.qr.png`.
5. Confirm install instructions tell the user to scan only the install QR.

If Rabbit rejects the scan, decode or inspect the QR payload and check that it
is JSON, not a link to a JSON file.
