# Rabbit Superuser Management PWA - Current Status Log

Updated: 2026-08-14 20:05 PDT

## Current Published State

- Repository: https://github.com/beaudown/rabbit-custom-creations-ui
- Live PWA: https://beaudown.github.io/rabbit-custom-creations-ui/
- Creation manifest: https://beaudown.github.io/rabbit-custom-creations-ui/creation-skill/manifest.json
- Current commit: `7a78da9 Add temporary SU enablement wizard`
- Branch: `main`
- Remote: `origin https://github.com/beaudown/rabbit-custom-creations-ui.git`
- GitHub Pages: public, HTTPS enforced, workflow deployment enabled.

## 2026-08-19 QR Validity Correction

- User reported the scanned QR was "not a valid creation."
- Root cause: the r1 Creations add-via-QR scanner was being pointed at a
  hosted JSON/URL manifest. That is not a Rabbit-generated Creation install QR,
  so the device rejection was correct.
- Updated `public/qr-launch-sheet.html` so it no longer presents the manifest
  URL or lease-pairing JSON as scannable Creation install QRs.
- Follow-up correction: the first QR now uses Rabbit's testing Creation payload
  shape: `title`, `url`, `description`, `iconUrl`, and `themeColor`. The `url`
  points to the HTTPS relay route-test URL with the broker endpoint prefilled.
- The release QR remains blocked until the route/service gates are verified,
  but the first QR is intended for testing install through r1 Creations add via
  QR.
- Validation passed after this correction: `npm run broker:validate`,
  `npm run lint`, and `npm test -- --runInBand` with localhost permission,
  25/25 passing.

## 2026-08-19 Hermes Full Project Context

- Added `docs/HERMES-FULL-PROJECT-CONTEXT-2026-08-19.md` as the full handoff
  document for Hermes/OpenClaw/Codex continuity.
- The document includes current deployment state, exact user test steps, QR
  payload rules, GitHub repo details, local file paths, safety boundaries,
  skills Hermes can adopt, known failure points, and next-step branches.
- Intended Hermes mirror path:
  `/Users/z3k3z/.hermes/memories/HERMES-FULL-PROJECT-CONTEXT-2026-08-19.md`.

## 2026-08-19 Creation Card Discoverability Fix

- User reported the Creation list was busy and they could not find
  `Rabbit SU Manager`.
- Updated the Rabbit-format testing Creation QR payload title to
  `A1 Broker Test` so the installed card is easier to spot and may sort near
  the top of the r1 Creations list.
- Updated QR sheet, tests, Codex handoff, Hermes full context, and Hermes
  fast-path context to use the new card name.

## 2026-08-19 Output Readability And Unique Install Marker

- User reported the output was not readable.
- Removed the three-line clamp from the Start Here status outputs.
- Added `Full output` expanders for Setup, Route, Service, Approval, and Gateway
  details so long JSON, URLs, and route errors wrap on the Rabbit display.
- Updated install metadata in `index.html` and `public/manifest.webmanifest` to
  `A1 Broker Test` because Rabbit may display app metadata instead of QR title.
- Added unique URL marker `creation=A1BrokerTestV2` to the testing Creation QR
  payload to avoid reusing an older installed Creation entry with stale naming.

## What Has Been Built

- Dark, high-contrast hosted PWA for Rabbit r1 custom creations and Superuser Management.
- Single Custom Creation package under `public/creation-skill/`.
- Offline service worker cache for Creation docs, broker manifests, guides, audit seed, and request templates.
- Safe Mac local broker scaffold under `scripts/mac-local-broker.mjs`.
- Broker startup cleanup contract: new broker starts must close or yield stale
  broker routes, clear previous transient configuration, preserve audit and
  Rabbit current-boot state, and write cleanup evidence before accepting
  requests.
- Dry-run broker request templates for reboot modes, ADB controls, storage mode, temporary privilege requests, service control, and custom skill upload.
- Interactive first-run readiness and temporary SU enablement wizard.
- Skill uploader UI and broker-side dry-run upload endpoint.
- Audit handoff contract for Rabbit LLM, Hermes, OpenClaw, ChatGPT/Codex, Claude, Rabbit intern, and DLAM.
- GitHub-hosted QR launch sheet at `/qr-launch-sheet.html` for PWA, Creation
  manifest, and lease-pairing targets.
- Audit archive/query tooling through `scripts/manage-audit-log.mjs` and npm
  scripts `audit:status`, `audit:archive`, and `audit:query`.

## Validation Already Completed

- `npm run broker:validate` passed.
- `npm run lint` passed.
- `npm test` passed with 20/20 tests.
- `npm run broker:export -- --out /private/tmp/rabbit-enable-wizard-export-check.json` passed.
- GitHub Pages deploy run `31859899503` completed successfully.
- HTTP 200 verified for the live PWA root URL.
- HTTP 200 verified for the live Creation manifest URL.
- Pre-publish secret-pattern scan only matched the validator's own denylist regex.
- 2026-08-14 follow-up QA:
  - `npm run broker:validate` passed.
  - `npm run lint` passed.
  - `npm test` first failed in the default sandbox because the localhost broker handshake could not fetch `127.0.0.1`; rerun with localhost permission passed 20/20.
  - Live GitHub Pages root returned HTTP 200.
  - Live Creation manifest returned HTTP 200.
  - Active safe Mac broker on `127.0.0.1:8792` returned healthy dry-run responses for `/health`, `/bridge/route`, `/adb/status`, and `/broker/service`.
  - Local Playwright/Puppeteer packages and `qrencode` were not installed, so browser-rendered QR/image acceptance remains a next manual or dependency-backed QA step.
- 2026-08-14 broker lifecycle update:
  - Added startup cleanup contract for new broker starts.
  - New broker startup must close or yield previous broker routes and clear stale transient route, endpoint, presence, pending service-control, and capability-detection state before accepting requests.
  - Cleanup must preserve audit history, queue files, rollback records, published templates, and Rabbit-local current-boot superuser state.
  - Safe Mac broker now exposes startup cleanup evidence through `/health`, `/broker/service`, and generated lease-pairing metadata.
  - Validation passed after this change: `npm run broker:validate`, `npm run lint`, and `npm test` with localhost permission, 20/20 passing.
  - Live smoke test started the updated Mac broker, verified `/health` and
    `/broker/service` reported `startupCleanup.performed=true`,
    `previousBrokerConfigurationsCleared=true`, and
    `privilegedExecutionPerformed=false`, then stopped the test broker.
  - Runtime seed files touched by the smoke test were restored to the committed
    GitHub state.

## Safety Boundary

No Rabbit device command, ADB, fastboot, WebUSB/WebSerial, DA, rooting, flashing,
erasing, slot change, APK install, exploit payload, on-device broker install,
OpenClaw gateway lifecycle, or Hermes lifecycle action has been run for this
package checkpoint.

Device work still requires separate live approval and a fresh device-state
check.

## Current Leave-Off Point

The next practical task is production acceptance testing of the live GitHub
Pages PWA with a real browser/device-size viewport, then a non-privileged Rabbit
open/import test if the user explicitly authorizes live device interaction.

Recommended immediate sequence:

1. Verify production layout and offline caching in real browser tooling.
2. Verify live PWA can fetch the Creation manifest and broker static assets.
3. Scan/open from the Rabbit only after explicit live device approval.
4. Only after explicit live approval, scan/open on the Rabbit and confirm import/readiness without privileged actions.
