# First-Run Readiness

Use this check the first time the Superuser Management Creation is opened on
Rabbit, and again after major updates.

## Required Checks

- Hosted PWA opened successfully.
- `creation-launcher.json` is reachable.
- Broker guides and request templates are reachable.
- Service worker and Cache API are available.
- Page has been reloaded once after service worker install.
- Broker `/health`, `/bridge/route`, `/broker/service`, and `/adb/status`
  endpoints are reachable when a broker is expected.
- Skill upload dry-run endpoint is available before relying on custom skill
  imports.

## Offline Meaning

Offline-ready means the UI, launcher, guides, templates, audit seed files, and
rollback/debug help are cached locally. It does not mean GitHub sync, remote
broker calls, ADB, reboot, USB storage mode, or skill hooks can run offline.

## Stop Conditions

Stop and stay in guide-only mode when:

- required launcher files are missing
- service worker or Cache API is unavailable
- broker endpoint is unreachable and the task needs broker execution
- route target is unknown
- uploaded skill hook would activate without broker approval
