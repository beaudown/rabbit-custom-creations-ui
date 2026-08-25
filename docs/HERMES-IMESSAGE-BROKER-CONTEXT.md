# Hermes iMessage Broker Context

Updated: 2026-08-25

Purpose: give Hermes the required endpoint and payload contract for
Rabbit/Hermes iMessage bridging without exposing local token values.

## Current Endpoint

- Private Creation UI URL:
  `https://michaels-macbook-pro.tailcfaeac.ts.net:10001/imessage-broker.html`
- Hermes verifier URL prefilled in the Creation:
  `https://michaels-macbook-pro.tailcfaeac.ts.net:8443`
- Tailnet HTTPS base URL:
  `https://michaels-macbook-pro.tailcfaeac.ts.net:10000`
- Local service:
  `http://127.0.0.1:8796`
- Tailscale Serve mapping:
  `https://michaels-macbook-pro.tailcfaeac.ts.net:10000/ -> http://127.0.0.1:8796`
- Public Funnel is not used for iMessage. This endpoint is tailnet-only.

## Hermes Verification Role

The Creation is now prefilled for Hermes-secured iMessage access. Rabbit or the
hosted Creation should call Hermes first, not store or print the iMessage broker
token.

Hermes should:

1. Verify the caller/session and requested route.
2. Read `/private/tmp/imessage-hermes-broker-token.txt` locally on the Mac.
3. Inject `x-imessage-broker-token` only on the server-side request to the
   broker.
4. Forward only allowlisted iMessage routes.
5. Return sanitized JSON and never include the token value in responses, logs,
   QR payloads, screenshots, shared memory, or hosted Creation output.

Prefilled Creation query parameters:

```text
creation=iMessageHermesBroker
app=https%3A%2F%2Fmichaels-macbook-pro.tailcfaeac.ts.net%3A10001%2Fimessage-broker.html
broker=https%3A%2F%2Fmichaels-macbook-pro.tailcfaeac.ts.net
hermes=https%3A%2F%2Fmichaels-macbook-pro.tailcfaeac.ts.net%3A8443
imessage=https%3A%2F%2Fmichaels-macbook-pro.tailcfaeac.ts.net%3A10000
```

## Authentication

Current default launcher mode is:

```text
IMESSAGE_BROKER_REQUIRE_TOKEN=true
IMESSAGE_BROKER_REQUIRE_SEND_TOKEN=true
```

So direct iMessage broker calls require the local token header. Hermes is the
intended verifier and token injector. Tokenless tailnet-only GET/read mode is
implemented but should be enabled only after explicit approval because it
exposes message content to tailnet clients. The broker header is:

```text
x-imessage-broker-token: <token>
```

Optional token source on the Mac:

```text
/private/tmp/imessage-hermes-broker-token.txt
```

Do not print, copy, save, or publish the token value in GitHub, QR codes,
shared memory, screenshots, transcripts, or hosted Creation output. The broker
and launcher use `IMESSAGE_BROKER_TOKEN_FILE` so the code can authenticate from
the local file without hardcoding the token.

## Routes

```text
GET  /imessage/health
GET  /imessage/messages
GET  /imessage/threads
POST /imessage/inbound
POST /imessage/send
POST /imessage/hermes-response
```

Full URLs:

```text
GET  https://michaels-macbook-pro.tailcfaeac.ts.net:10000/imessage/health
GET  https://michaels-macbook-pro.tailcfaeac.ts.net:10000/imessage/messages?since=<nextCursor>&limit=25
GET  https://michaels-macbook-pro.tailcfaeac.ts.net:10000/imessage/threads?threadLimit=15&perDirection=25
POST https://michaels-macbook-pro.tailcfaeac.ts.net:10000/imessage/inbound
POST https://michaels-macbook-pro.tailcfaeac.ts.net:10000/imessage/send
POST https://michaels-macbook-pro.tailcfaeac.ts.net:10000/imessage/hermes-response
```

## Message Polling

Hermes can poll new broker-captured inbound messages after verifying the caller:

```bash
TOKEN="$(cat /private/tmp/imessage-hermes-broker-token.txt)"
curl -skS \
  -H "x-imessage-broker-token: $TOKEN" \
  "https://michaels-macbook-pro.tailcfaeac.ts.net:10000/imessage/messages?since=<nextCursor>&limit=25"
```

Response includes:

- `messages`
- `nextCursor`
- `hasMore`

Important limitation: `GET /imessage/messages` returns messages captured by
the broker through `POST /imessage/inbound`. It does not scrape historical
Messages.app database content.

Current broker-captured message data path on the Mac:

```text
/private/tmp/imessage-hermes-broker-state/public/broker/imessage-messages.jsonl
```

Read-only local Messages thread data is served from:

```text
~/Library/Messages/chat.db
```

Use this endpoint for the last 15 threads with up to 25 received and 25 sent
messages per thread:

```bash
TOKEN="$(cat /private/tmp/imessage-hermes-broker-token.txt)"
curl -skS \
  -H "x-imessage-broker-token: $TOKEN" \
  "https://michaels-macbook-pro.tailcfaeac.ts.net:10000/imessage/threads?threadLimit=15&perDirection=25"
```

Current audit path on the Mac:

```text
/private/tmp/imessage-hermes-broker-state/public/broker/imessage-audit-log.jsonl
```

## Sending Replies

Hermes should use either send endpoint after verifying the reply request:

```text
POST /imessage/send
POST /imessage/hermes-response
```

Minimum body:

```json
{
  "to": "+15555550100",
  "text": "Reply message text"
}
```

Preferred body:

```json
{
  "requestId": "reply-001",
  "to": "+15555550100",
  "text": "Reply message text",
  "attachments": []
}
```

Accepted recipient fields: `to`, `recipient`, `phone`, or `email`.
Accepted message fields: `text` or `message`.

## Attachment Policy

- If a small thumbnail path is provided and is under
  `IMESSAGE_BROKER_MAX_THUMBNAIL_BYTES`, the broker marks it as preferred.
- If no sendable thumbnail exists, the broker asks Hermes to describe the
  attachment through `HERMES_IMESSAGE_DESCRIBE_PATH`.
- If Hermes is unavailable, the broker falls back to metadata description.
- Current sending path sends text descriptions. Thumbnail file-send adapter is
  not yet enabled.

## Current Runtime Expectations

- Desktop launcher:
  `/Users/z3k3z/Desktop/Launch iMessage Hermes Broker.command`
- Launcher token mode:
  `IMESSAGE_BROKER_REQUIRE_TOKEN=true` and
  `IMESSAGE_BROKER_REQUIRE_SEND_TOKEN=true`
- Real send gate:
  `IMESSAGE_BROKER_ALLOW_SEND=true`
- Hermes upstream default:
  `HERMES_IMESSAGE_UPSTREAM=http://127.0.0.1:9120`
- macOS may require Automation permission for Terminal/Node to send through
  Messages.app.

## Safety Boundary

This iMessage broker is separate from Rabbit root/SU, ADB, fastboot, recovery,
reboot, install, flash, and on-device broker work. It must not be treated as
privileged Rabbit execution.
