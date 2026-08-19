# Gemini Notebook Context Archive - Rabbit A1 Broker Test

Updated: 2026-08-19 09:45 PDT

Audience: Gemini Notebook / NotebookLM, Gemini, Hermes, OpenClaw, Codex, or any
assistant reviewing the Rabbit r1 A1 Broker Test and Superuser Management PWA.

This archive is designed to be uploaded as a single notebook source. It
summarizes the project state, references the important repo files, explains the
current blocker, and defines the next safe test. It intentionally excludes
secrets and relay token values.

## One-Sentence Current State

The Rabbit A1 Broker Test is deployed and can reach the public HTTPS relay, the
Mac relay token-file/process mismatch has been fixed, local authenticated relay
checks now pass with HTTP 200, and the only safe next step is a user-operated
Rabbit Step 1 and Step 2 retest with the manually entered local relay token.

## Public Sources

- GitHub repo: `https://github.com/beaudown/rabbit-custom-creations-ui`
- Live app: `https://beaudown.github.io/rabbit-custom-creations-ui/`
- QR launch sheet:
  `https://beaudown.github.io/rabbit-custom-creations-ui/qr-launch-sheet.html`
- Current branch: `main`
- Latest important commit:
  `3e15f51 Read relay token from local token file`
- Latest known successful GitHub Pages deployment:
  `32277495720`

## Local Sources

- Repo root:
  `/Users/z3k3z/Documents/Omi Dev Space/rabbit-custom-creations-ui`
- Shared Rabbit source of truth:
  `/Users/z3k3z/Documents/AgentSharedMemory/shared/SOURCE-OF-TRUTH.md`
- Shared session index:
  `/Users/z3k3z/Documents/AgentSharedMemory/shared/session-index.json`
- Codex shared inbox:
  `/Users/z3k3z/Documents/AgentSharedMemory/shared/inbox/codex-chatgpt.md`
- Relay token file, local-only:
  `/private/tmp/rabbit-https-relay-token.txt`

Do not upload, print, paste, copy, summarize, QR-encode, or store the relay
token value. The token path may be referenced, but the value must remain local.

## Required Read Order For Gemini

If Gemini can access the repo, read these files in this order:

1. `docs/GEMINI-NOTEBOOK-CONTEXT-ARCHIVE-2026-08-19.md`
2. `docs/CURRENT-STATUS-LOG.md`
3. `docs/HERMES-FULL-PROJECT-CONTEXT-2026-08-19.md`
4. `docs/codex-handoff.md`
5. `scripts/gateway-relay.mjs`
6. `tests/gateway-relay.test.mjs`
7. `app/page.tsx`
8. `public/qr-launch-sheet.html`
9. `public/broker/release-gate.json`
10. `public/broker/remote-broker-config.json`

If Gemini cannot access GitHub, upload this Markdown archive plus those files as
sources.

## Safety Boundary

Allowed for assistants:

- Inspect repo files.
- Review architecture.
- Review test results.
- Suggest safe host-side diagnostics.
- Suggest wording or UI improvements.
- Propose next reversible steps.

Not allowed unless the user gives fresh explicit live action-time approval:

- Rabbit device commands.
- ADB.
- Fastboot.
- Recovery.
- WebUSB/WebSerial.
- DA/Preloader.
- Root/SU payload execution.
- Reboot or boot-mode changes.
- APK install.
- Flash, erase, partition writes, slot changes.
- On-device broker install.
- Cleanup actions that remove evidence.
- Release QR activation.
- OpenClaw/Hermes gateway auth or lifecycle changes.

Release QR remains blocked until Rabbit reports successful route status.

## Project Purpose

This project builds a Rabbit r1 Custom Creation / hosted PWA named
`A1 Broker Test` for testing a future Superuser Management flow. The PWA is
hosted on GitHub Pages and interacts with a Mac-local fallback broker through an
authenticated HTTPS relay. At this stage it is a route test and diagnostic UI,
not a privileged executor.

The eventual architecture is:

- GitHub Pages hosts static UI, manifests, guides, and templates.
- Rabbit r1 opens the testing Custom Creation.
- The Creation calls an HTTPS relay endpoint.
- The HTTPS relay runs on the Mac and forwards only allowlisted requests.
- The relay calls the Mac local broker.
- The Mac local broker currently returns safe dry-run/status responses.
- A future Rabbit-native broker may become the preferred executor, but it is not
  installed or validated.

## Current Test Name And QR Rule

The installed Rabbit Creation should appear as:

`A1 Broker Test`

The QR sheet is:

`https://beaudown.github.io/rabbit-custom-creations-ui/qr-launch-sheet.html`

Important QR rule:

Rabbit `Creations > add via QR` does not accept a plain hosted URL or a manifest
URL as a Creation install QR. The QR must encode Rabbit-style Creation JSON with
these fields:

```json
{
  "title": "A1 Broker Test",
  "url": "https://beaudown.github.io/rabbit-custom-creations-ui/?creation=A1BrokerTestV2&broker=https%3A%2F%2Fmichaels-macbook-pro.tailcfaeac.ts.net",
  "description": "Testing-only Rabbit r1 broker route check. Run Step 1 and Step 2 only.",
  "iconUrl": "https://beaudown.github.io/rabbit-custom-creations-ui/favicon.svg",
  "themeColor": "#FE5000"
}
```

Do not encode the relay token into the QR.

## Current Broker And Relay Route

Rabbit-facing broker endpoint:

`https://michaels-macbook-pro.tailcfaeac.ts.net`

Local relay:

`http://127.0.0.1:8794`

Mac broker upstream:

`http://100.80.216.88:8792`

Relay token path:

`/private/tmp/rabbit-https-relay-token.txt`

The relay token must be typed manually into the `Relay token` field in the
Start Here box. It must not be pasted into assistant chats or uploaded to
Notebook/GitHub/Drive.

## Latest Root Cause And Fix

Observed Rabbit output before the latest fix:

- Step 1: `assets_ready_relay_auth_required`
- Step 2: `relay_auth_required`
- Endpoint statuses were HTTP `401` for:
  - `health`
  - `bridgeRoute`
  - `adbStatus`

Interpretation:

Rabbit reached the public HTTPS relay, but relay authentication failed. This was
not a total network outage.

Local-only diagnostics then found:

- The relay was listening on `127.0.0.1:8794`.
- The file `/private/tmp/rabbit-https-relay-token.txt` existed.
- Authenticated localhost checks using that token file still returned HTTP 401.
- Therefore, the token file did not match the running relay process.

Fix:

- Commit `3e15f51 Read relay token from local token file`.
- `scripts/gateway-relay.mjs` now supports `RABBIT_RELAY_TOKEN_FILE`.
- The relay reads the token file at request time instead of relying only on an
  environment variable captured at process start.
- Regression test added:
  `gateway relay can read auth token from a local token file`.
- Mac relay was restarted with:
  `RABBIT_RELAY_TOKEN_FILE=/private/tmp/rabbit-https-relay-token.txt`.

Validated local result after restart:

- `/relay/health`: HTTP 200
- `/health`: HTTP 200
- `/bridge/route`: HTTP 200
- `/adb/status`: HTTP 200

No token value was printed or copied.

## Relevant Commits

- `3e15f51 Read relay token from local token file`
  - Adds file-backed token support to the relay.
  - Adds regression test for token-file auth.
  - Documents the token file/process mismatch fix.
- `72328b1 Handle relay auth failures in A1 test`
  - Adds Relay token field directly in Start Here.
  - Adds `401`-specific UI messages:
    `assets_ready_relay_auth_required` and `relay_auth_required`.
- `c851783 Show partial broker endpoint failures`
  - Makes Step 2 show `endpointStatuses` and `failedEndpoints`.
  - Stops hiding partial failures behind `No route selected`.
- `d516f6f Improve Rabbit test output readability`
  - Adds Full output expanders and better wrapping.
- `1ad2281 Rename testing Creation for discoverability`
  - Renames the Creation display metadata to `A1 Broker Test`.

## Validation Evidence

Latest validation after `3e15f51`:

```text
npm run lint
passed

npm run broker:validate
Superuser package is ready:
- 10 request templates
- 6 walkthrough entries
- 7 execution gates

npm test -- --runInBand
26/26 tests passed
```

Latest GitHub Pages deployment:

```text
Run: 32277495720
Workflow: Deploy GitHub Pages
Status: success
Commit: 3e15f51
```

Important note: localhost tests can fail in restricted sandboxes with `EPERM`
unless localhost listener permission is granted.

## What The App UI Does

The first visible box is `Start Here`.

It contains:

- Broker URL readout.
- Relay token field.
- `1 Check setup`.
- `2 Detect route`.
- `3 Service status`.
- `4 Approval dialog`.
- `5 Gateway relay`.
- Full output expanders for status JSON.

Current user instructions are to use only:

1. `1 Check setup`
2. `2 Detect route`

Then stop.

Do not proceed to Step 3 or later until Step 2 output is reviewed.

## Expected Good Rabbit Output

After the user enters the current token from
`/private/tmp/rabbit-https-relay-token.txt`, Step 2 should ideally show
HTTP 200/OK for:

- `health`
- `bridgeRoute`
- `adbStatus`

If it still shows `401`, likely causes are:

- The token was mistyped on Rabbit.
- Rabbit is using stale app state and needs the Creation reopened/reloaded.
- The token file changed after the user copied it.
- The relay process was restarted without `RABBIT_RELAY_TOKEN_FILE`.
- The public relay path is reaching an older relay process.

If it shows a non-401 failure, the next step is to inspect the exact
`endpointStatuses` and `failedEndpoints` fields.

## Next Safe User Test

Give the user these steps:

1. On the Mac, open:
   `open -a TextEdit /private/tmp/rabbit-https-relay-token.txt`
2. On Rabbit, reopen `A1 Broker Test`.
3. In the `Start Here` box, enter that token in `Relay token`.
4. Tap `1 Check setup`.
5. Tap `2 Detect route`.
6. Stop there.
7. Report whether `health`, `bridgeRoute`, and `adbStatus` show `200/OK`.

The user must not send the token value.

## Known Failure Points

- Rabbit QR scanner rejects non-Creation QR payloads.
- Rabbit may keep an older installed Creation with stale display metadata.
- Hosted Pages may serve a cached bundle briefly after deploy.
- The Rabbit screen is small; long JSON output must be in expanders.
- Relay token entry on Rabbit is manual and error-prone.
- A token file/process mismatch can cause repeated `401`.
- Public relay auth must stay enabled; do not disable relay auth to make tests
  easier.
- GitHub Pages is static storage only, not an executor.
- The Mac broker is fallback/status-only and has
  `privilegedExecutionEnabled=false`.
- Rabbit-native privileged broker is not installed or validated.
- Release QR must remain blocked until Rabbit route status is confirmed.

## Security And Token Rules

The relay token may be referenced only by path:

`/private/tmp/rabbit-https-relay-token.txt`

Never include the token value in:

- Gemini Notebook.
- ChatGPT/Codex messages.
- Hermes/OpenClaw memory.
- Google Drive files.
- GitHub files.
- QR payloads.
- Screenshots.
- Logs intended for sharing.

If a test requires the token, the user must manually read it on the Mac and type
it into the Rabbit UI.

## What Gemini Should Do

Gemini should:

1. Treat `3e15f51` as the latest source state.
2. Review the relay/token-file architecture for correctness.
3. Review whether `scripts/gateway-relay.mjs` keeps routes allowlisted and
   authenticated.
4. Review whether `app/page.tsx` gives clear enough Step 1/Step 2 instructions.
5. Identify likely causes only if Rabbit still gets `401`.
6. Suggest the smallest safe next diagnostic.
7. Keep recommendations concise and avoid privileged device actions.

Gemini should not:

- Ask for the relay token value.
- Recommend disabling auth.
- Recommend embedding token in QR.
- Recommend Rabbit ADB/root/reboot/install/cleanup/release QR.
- Claim deployment is release-ready before the Rabbit route test returns 200/OK.

## Suggested Gemini Prompt

```text
Use this source as the current archive for the Rabbit A1 Broker Test project.

Public repo:
https://github.com/beaudown/rabbit-custom-creations-ui

Latest source state:
Commit 3e15f51 - Read relay token from local token file.

Current issue:
Rabbit previously reached the HTTPS relay but got HTTP 401 for health,
bridgeRoute, and adbStatus. Codex found the Mac relay process token did not
match /private/tmp/rabbit-https-relay-token.txt. The relay now supports
RABBIT_RELAY_TOKEN_FILE and was restarted to read that file at request time.
Local authenticated checks now pass with HTTP 200 for /health, /bridge/route,
and /adb/status.

Security rules:
Do not ask for, store, print, embed, summarize, or QR-encode the relay token.
The token path may be referenced, but the value must remain local-only.
Do not recommend ADB, root, reboot, install, fastboot, recovery, flashing,
cleanup, or release QR.

Next safe test:
The user should type the token manually into A1 Broker Test, run only Step 1 and
Step 2, then report whether endpointStatuses are 200/OK.

Your task:
Review the architecture and identify the smallest safe next diagnostic if the
Rabbit still reports 401 or another endpoint failure.
```

## Archive File Manifest

For a full upload bundle, include:

- `docs/GEMINI-NOTEBOOK-CONTEXT-ARCHIVE-2026-08-19.md`
- `docs/CURRENT-STATUS-LOG.md`
- `docs/HERMES-FULL-PROJECT-CONTEXT-2026-08-19.md`
- `docs/codex-handoff.md`
- `docs/gateway-relay.md`
- `docs/https-relay-test-2026-08-19.md`
- `scripts/gateway-relay.mjs`
- `scripts/mac-local-broker.mjs`
- `scripts/relay-preflight.mjs`
- `tests/gateway-relay.test.mjs`
- `tests/rendered-html.test.mjs`
- `app/page.tsx`
- `app/globals.css`
- `public/qr-launch-sheet.html`
- `public/broker/release-gate.json`
- `public/broker/remote-broker-config.json`
- `public/broker/mac-local-broker-config.json`
- `public/broker/rabbit-native-broker-spec.json`
- `public/creation-skill/manifest.json`
- `public/creation-skill/first-run-readiness.md`
- `public/creation-skill/enablement-guide.md`
- `public/creation-skill/walkthrough-guide.md`
- `public/creation-skill/execution-checklist.md`

Do not include `/private/tmp/rabbit-https-relay-token.txt`.
