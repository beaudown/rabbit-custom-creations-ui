# iMessage Hermes Broker Handoff

Updated: 2026-08-27

This handoff is only for the iMessage Hermes Broker Creation and Mac-side
iMessage bridge. It is separate from the Rabbit `A1 Broker Test` and must not
advance Rabbit privileged gates.

## QR and Hosted Surfaces

- iMessage QR sheet:
  `https://beaudown.github.io/rabbit-custom-creations-ui/imessage-hermes-qr-sheet.html`
- iMessage Creation app:
  `https://beaudown.github.io/rabbit-custom-creations-ui/imessage-broker-actions.html?cache=daf6b5b&broker=https%3A%2F%2Fmichaels-macbook-pro.tailcfaeac.ts.net&hermes=https%3A%2F%2Fmichaels-macbook-pro.tailcfaeac.ts.net&imessage=https%3A%2F%2Fmichaels-macbook-pro.tailcfaeac.ts.net%3A10000`
- A1 Broker Test QR sheet remains separate:
  `https://beaudown.github.io/rabbit-custom-creations-ui/qr-launch-sheet.html`

The iMessage QR encodes Rabbit's Creation JSON payload with `title`, `url`,
`description`, `iconUrl`, and `themeColor`. It contains no tokens, headers,
local file paths, or privileged commands.

## Hermes Role

Hermes is the verifier and broker-token injector for iMessage routes. The
Rabbit Creation should call Hermes first. Hermes should verify the caller,
forward only allowlisted iMessage routes, inject the local broker token
server-side, and return sanitized JSON without exposing token values.

Allowed iMessage routes:

```text
GET  /imessage/health
GET  /imessage/messages
GET  /imessage/threads
GET  /imessage/contacts
POST /imessage/inbound
POST /imessage/send
POST /imessage/hermes-response
```

## Endpoints

```text
Hermes verifier: https://michaels-macbook-pro.tailcfaeac.ts.net:8443
iMessage broker:  https://michaels-macbook-pro.tailcfaeac.ts.net:10000
Local broker:     http://127.0.0.1:8796
Launcher:         /Users/z3k3z/Desktop/Launch iMessage Hermes Broker.command
```

Do not print, paste, store, or publish the iMessage broker token. The local
token source may be referenced by path only:

```text
/private/tmp/imessage-hermes-broker-token.txt
```

## Separation From A1 Broker

- `A1 Broker Test` validates the Rabbit broker route and Step 2 output.
- `iMessage Hermes Broker` validates Hermes-mediated iMessage read/send
  contracts.
- Neither iMessage broker success nor Hermes GUI success authorizes ADB,
  fastboot, root/SU, reboot, install, recovery, flashing, release QR enablement,
  or on-device broker install.

## Current Host Validation

Local validation on 2026-08-27 passed after separating QR sheets:

```text
npm run broker:validate
npm run lint
npm test
```

The full test suite requires localhost listener permission for broker, relay,
and iMessage test servers.
