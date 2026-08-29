# Local Creation QR Skill Handoff

Updated: 2026-08-29

Audience: Hermes, OpenClaw, Codex/ChatGPT, and any local assistant creating
Rabbit r1 Custom Creation install QRs for this project.

## Purpose

The new `rabbit-custom-creation-local-qr` skill creates Rabbit-valid Custom
Creation QR artifacts locally. It supports both public hosted app URLs and
private local-only URLs, but the QR image itself does not need to be uploaded to
GitHub or any QR web service.

Skill source in repo:

`/Users/z3k3z/Documents/Omi Dev Space/rabbit-custom-creations-ui/skills/rabbit-custom-creation-local-qr`

Mirrors should be kept at:

- Hermes:
  `/Users/z3k3z/.hermes/skills/rabbit-custom-creation-local-qr`
- OpenClaw:
  `/Users/z3k3z/.openclaw/workspace/skills/rabbit-custom-creation-local-qr`
- Codex local skill:
  `/Users/z3k3z/.codex/skills/rabbit-custom-creation-local-qr`

## Correct QR Logic

Rabbit `Creations > add via QR` does not install from a plain URL. The QR must
encode the Rabbit Creation JSON object directly:

```json
{
  "title": "A1 Broker Test",
  "url": "https://michaels-macbook-pro.tailcfaeac.ts.net/rabbit-custom-creations-ui/?creation=A1BrokerTestLocal",
  "description": "Testing-only Rabbit r1 broker route check. Run Step 1 and Step 2 only.",
  "iconUrl": "https://michaels-macbook-pro.tailcfaeac.ts.net/rabbit-custom-creations-ui/favicon.svg",
  "themeColor": "#FE5000"
}
```

Do not scan or label these as Creation install QRs:

- GitHub Pages URL by itself.
- QR sheet URL.
- Manifest URL.
- Lease-pairing URL.
- Broker endpoint URL.
- Route-test URL.
- Any URL containing a token, header, or one-time session value.

## Local-Only Meaning

Local-only means the QR artifact files stay on the Mac. Rabbit still needs the
`url` and `iconUrl` to be reachable over a network path it can access, such as
Tailscale Serve, a LAN route, or the approved Rabbit gateway route. Rabbit
cannot install a Creation from a `file://` path on the Mac.

Dependency files should be served from the same reachable base URL when possible:

- `/creation-skill/manifest.json`
- `/broker/lease-pairing.json`
- `/broker/actions/catalog`
- `/assets/...`

The dependency URLs are loaded by the Creation app after install. They are not
the install QR payload.

## Tool Command

From the repo root:

```bash
npm run creation:qr:local -- \
  --title "A1 Broker Test" \
  --url "https://michaels-macbook-pro.tailcfaeac.ts.net/rabbit-custom-creations-ui/?creation=A1BrokerTestLocal" \
  --description "Testing-only Rabbit r1 broker route check. Run Step 1 and Step 2 only." \
  --icon-url "https://michaels-macbook-pro.tailcfaeac.ts.net/rabbit-custom-creations-ui/favicon.svg" \
  --theme-color "#FE5000" \
  --out "/private/tmp/rabbit-creation-qr" \
  --name "a1-broker-test-local"
```

Outputs:

- `/private/tmp/rabbit-creation-qr/a1-broker-test-local.creation.json`
- `/private/tmp/rabbit-creation-qr/a1-broker-test-local.payload.txt`
- `/private/tmp/rabbit-creation-qr/a1-broker-test-local.qr.png`
- `/private/tmp/rabbit-creation-qr/a1-broker-test-local.scan.html`

Optional:

```bash
npm run creation:qr:local -- ... --check-urls
```

Use `--check-urls` only when the route is currently reachable from the Mac. A
Mac-side HTTP 200 does not prove the Rabbit can reach the same route.

## Safety Rules

- Never embed relay tokens, Hermes session tokens, Tailscale auth keys, GitHub
  tokens, headers, passwords, or secrets in the QR.
- Never encode root, ADB, fastboot, flash, erase, install, or privileged
  command text in the QR.
- Do not commit generated QR artifacts that were created for local-only access.
- If Rabbit says the QR is not a valid custom creation, inspect
  `<name>.payload.txt`. It must be JSON with only `title`, `url`,
  `description`, `iconUrl`, and `themeColor`.

## Validation Added

New focused test:

```bash
node --test tests/local-creation-qr-skill.test.mjs
```

Verified behavior:

- Generates a Rabbit-format `.creation.json` payload.
- Generates a local `.qr.png` using the local Node `qrcode` package.
- Generates a review `.scan.html`.
- Refuses secret-looking payloads such as `relayToken`.
