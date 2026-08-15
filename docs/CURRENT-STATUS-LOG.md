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

1. Add or approve a QR-generation path from the GitHub-hosted URLs.
2. Verify production layout and offline caching in real browser tooling.
3. Verify live PWA can fetch the Creation manifest and broker static assets.
4. Scan/open from the Rabbit only after explicit live device approval.
5. Generate final QR images or scan sheet for:
   - PWA launch URL
   - Creation manifest URL
   - Lease pairing URL
6. Only after explicit live approval, scan/open on the Rabbit and confirm import/readiness without privileged actions.
