# Gemini Skill Import README - Rabbit A1 Broker Test

Updated: 2026-08-19

Use this README as the first source when importing the project skill into
Gemini Notebook / NotebookLM.

## What This Bundle Is

This is a focused import bundle for the Rabbit `A1 Broker Test` Custom Creation
skill and its dependent project files. It is smaller than the full project
archive and is intended for Gemini to review the skill behavior, dependency
contracts, broker route, relay auth model, and next safe development tasks.

## Current State

- Public repo: `https://github.com/beaudown/rabbit-custom-creations-ui`
- Latest implementation commit: `3e15f51 Read relay token from local token file`
- Latest collaboration commit: `befcf60 Add Gemini Codex collaboration workflow`
- Live app: `https://beaudown.github.io/rabbit-custom-creations-ui/`
- QR sheet:
  `https://beaudown.github.io/rabbit-custom-creations-ui/qr-launch-sheet.html`
- Creation name: `A1 Broker Test`
- Release QR: blocked.
- Next safe Rabbit action: Step 1 and Step 2 only after manual relay-token entry.

## Security Boundary

Do not ask for, store, print, summarize, upload, screenshot, QR-encode, or commit
the relay token value.

The token path may be referenced:

`/private/tmp/rabbit-https-relay-token.txt`

The token value must never be imported into Gemini, GitHub, Google Drive, shared
memory, screenshots, or chat transcripts.

## Skill Files Included

Primary Rabbit Custom Creation skill:

- `public/creation-skill/manifest.json`
- `public/creation-skill/creation-launcher.json`
- `public/creation-skill/settings.json`
- `public/creation-skill/instructions.md`
- `public/creation-skill/first-run-readiness.md`
- `public/creation-skill/enablement-guide.md`
- `public/creation-skill/broker-service-guide.md`
- `public/creation-skill/custom-skill-uploader.md`
- `public/creation-skill/usb-storage-guide.md`
- `public/creation-skill/walkthrough-guide.md`
- `public/creation-skill/execution-checklist.md`

Dependent broker contracts:

- `public/broker/assistant-collaboration-board.json`
- `public/broker/release-gate.json`
- `public/broker/remote-broker-config.json`
- `public/broker/mac-local-broker-config.json`
- `public/broker/rabbit-native-broker-spec.json`
- `public/broker/gateway-topology.json`
- `public/broker/broker-coordination.json`
- `public/broker/execution-checklist.json`
- `public/broker/walkthrough-guide.json`
- `public/broker/prompt-library.json`
- `public/broker/sync-manifest.json`
- `public/broker/request-templates/*.json`

Dependent implementation and validation files:

- `app/page.tsx`
- `app/globals.css`
- `scripts/gateway-relay.mjs`
- `scripts/mac-local-broker.mjs`
- `scripts/relay-preflight.mjs`
- `tests/gateway-relay.test.mjs`
- `tests/rendered-html.test.mjs`

Coordination files:

- `docs/GEMINI-CODEX-COLLABORATION.md`
- `docs/GEMINI-REVIEW-INBOX.md`
- `docs/GEMINI-NOTEBOOK-CONTEXT-ARCHIVE-2026-08-19.md`
- `docs/CURRENT-STATUS-LOG.md`

## What Gemini Should Review

Ask Gemini to answer:

```text
Use the uploaded Rabbit A1 Broker Test skill import bundle.

Review the Custom Creation skill and its dependent broker/relay files.

Current state:
The Mac relay token-file/process mismatch was fixed at commit 3e15f51. The relay
now supports RABBIT_RELAY_TOKEN_FILE and local authenticated checks pass with
HTTP 200 for /health, /bridge/route, and /adb/status. Release QR is blocked.
The next safe Rabbit action is Step 1 and Step 2 only after manual token entry.

Your task:
1. Identify whether the skill files and broker dependencies are internally
   consistent.
2. Identify any missing dependency files Gemini would need before reviewing the
   next development task.
3. If Rabbit still reports 401, suggest the smallest safe diagnostic that does
   not expose the token and does not require Rabbit ADB/root/reboot/install.
4. Do not recommend disabling auth, embedding the token in a QR, release QR, or
   privileged Rabbit actions.

Respond using the GEMINI REVIEW format from docs/GEMINI-CODEX-COLLABORATION.md.
```

## Expected Gemini Output Format

```text
GEMINI REVIEW
Source set used:
- <files>

Question answered:
<one sentence>

Findings:
1. <finding>
2. <finding>

Recommended next step:
<one safe step>

Do not do:
- <unsafe action>

Open questions:
- <missing evidence>
```

## Codex Intake

After Gemini responds, paste its answer back to Codex. Codex will:

1. Record it in `docs/GEMINI-REVIEW-INBOX.md`.
2. Verify claims against local files and command output.
3. Implement only safe, scoped changes.
4. Run validation.
5. Commit, push, and update the collaboration board.

