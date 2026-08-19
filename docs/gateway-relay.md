# Gateway Relay Sidecar

The gateway relay is a local, authenticated bridge between a Rabbit-reachable
HTTPS route and the Mac fallback broker.

It exists to fix the current blocker without weakening the broker boundary:
Rabbit can load the hosted app, but it cannot reach the Mac-only broker route.

## Current State

- Implemented: `scripts/gateway-relay.mjs`
- Start command: `npm run relay:gateway`
- Preflight command: `npm run relay:preflight`
- Default local URL: `http://127.0.0.1:8794`
- Default upstream broker: `http://127.0.0.1:8792`
- Release status: not ready
- Missing release requirement: public HTTPS route reachable from Rabbit

## Required Environment

```bash
RABBIT_RELAY_TOKEN=generated-test-token
RABBIT_RELAY_UPSTREAM=http://127.0.0.1:8792
RABBIT_RELAY_HOST=127.0.0.1
RABBIT_RELAY_PORT=8794
RABBIT_RELAY_PUBLIC_URL=https://example-relay-host
```

Do not commit `RABBIT_RELAY_TOKEN`. Do not place it in GitHub Pages.

## Substitute Decision

Use this command before generating any new QR:

```bash
npm run relay:preflight
```

The current substitute for the unreachable Mac private HTTP endpoint is an
authenticated public HTTPS relay. That route still requires explicit approval
before exposure and a Rabbit-side test before release.

Do not substitute with:

- raw `http://100.x.x.x` Tailscale URLs from the hosted Creation,
- tokenless public Funnel/proxy routes,
- `hole.rabbit.tech` as a Tailscale or broker proxy,
- QR URLs containing OpenClaw, Hermes, Rabbit connector, GitHub, or relay
  secrets.

## Allowed Routes

The relay forwards only these routes:

- `GET /health`
- `GET /bridge/route`
- `GET /adb/status`
- `GET /broker/service`
- `POST /broker/service`
- `GET /actions/catalog`
- `POST /actions`
- `POST /requests`
- `POST /skills/upload`
- `GET /rabbit-broker/health`
- `GET /rabbit-broker/actions/catalog`
- `POST /rabbit-broker/actions`

Everything else returns `route_not_allowlisted`.

## Auth

Broker forwarding requires either:

- header `x-rabbit-relay-token`, or
- query parameter `relay_token`.

The hosted app supports an optional relay token field. This is for testing only
until the final HTTPS/auth flow is chosen.

## Safety Boundary

The relay does not execute root, ADB, reboot, install, fastboot, recovery,
shell, flash, or storage actions. It forwards broker requests and returns the
broker result. Privileged execution must remain false unless a validated
Rabbit-native executor later performs an approved action.

## Release Gate

`public/broker/release-gate.json` remains `testing_only` and
`releaseQrAllowed=false` until:

- a public HTTPS relay URL exists,
- relay auth is configured,
- Rabbit reaches the relay from the Creation,
- route, service, approval, and gateway checks return controlled responses,
- no secrets are exposed in the hosted app or QR payload.
