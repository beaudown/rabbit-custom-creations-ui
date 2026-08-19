# Gemini and Codex Collaboration Protocol

Updated: 2026-08-19

Purpose: keep Gemini Notebook, Gemini chat, Codex, Hermes, and OpenClaw aligned
without losing context, leaking secrets, or repeating work.

## Current Source Of Truth

Use this order when there is any conflict:

1. `docs/GEMINI-NOTEBOOK-CONTEXT-ARCHIVE-2026-08-19.md`
2. `docs/CURRENT-STATUS-LOG.md`
3. `public/broker/assistant-collaboration-board.json`
4. `docs/GEMINI-REVIEW-INBOX.md`
5. `docs/codex-handoff.md`
6. Shared federation under `/Users/z3k3z/Documents/AgentSharedMemory/shared/`

Latest technical state at the time this protocol was created:

- Latest implementation commit: `3e15f51 Read relay token from local token file`
- Latest context archive commit: `ea208fe Add Gemini notebook context archive`
- Relay token-file/process mismatch is fixed locally.
- Local authenticated relay checks pass for `/health`, `/bridge/route`, and
  `/adb/status`.
- Release QR remains blocked.
- Next safe Rabbit action is still Step 1 and Step 2 only in `A1 Broker Test`.

## Roles

Gemini Notebook:

- Holds the broad project context archive.
- Answers architecture, risk, and failure-mode questions from uploaded sources.
- Reviews proposed plans and identifies missing context.
- Does not execute commands or assume live system state.

Gemini chat:

- Produces concise review notes, hypotheses, and next-step recommendations.
- Uses the response format in `docs/GEMINI-REVIEW-INBOX.md`.
- Does not request secrets or privileged Rabbit actions.

Codex:

- Reads Gemini review notes.
- Verifies claims against local files and command output.
- Implements code/docs/tests.
- Runs validation.
- Commits and pushes intentional changes.
- Updates status logs, shared memory, and the collaboration board.

Hermes/OpenClaw:

- Consume the current handoff state.
- Keep their own claims evidence-based.
- Do not supersede the shared source of truth without tool/file evidence.

User:

- Moves text between Gemini and Codex when no direct connector exists.
- Operates the Rabbit device for manual Step 1/Step 2 tests.
- Never pastes relay token values into any assistant.

## Working Loop

1. Codex publishes or updates the context archive and board.
2. User uploads the archive zip to Gemini Notebook.
3. User asks Gemini the active review question from the board.
4. User pastes Gemini's answer into Codex.
5. Codex classifies the answer:
   - confirmed by repo evidence
   - useful hypothesis
   - blocked by missing evidence
   - unsafe or out of scope
6. Codex implements only confirmed or safely testable changes.
7. Codex runs validation.
8. Codex updates:
   - `docs/CURRENT-STATUS-LOG.md`
   - `docs/GEMINI-REVIEW-INBOX.md`
   - `public/broker/assistant-collaboration-board.json`
   - shared federation, when the next safe action changes
9. Repeat.

## Message Format For Gemini Reviews

Ask Gemini to respond in this format:

```text
GEMINI REVIEW
Source set used:
- <files or archive names>

Question answered:
<one sentence>

Findings:
1. <finding, with source file if possible>
2. <finding, with source file if possible>

Recommended next step:
<one safe step>

Do not do:
- <unsafe or premature action>

Open questions:
- <missing evidence>
```

## Safety Rules

Never send Gemini:

- `/private/tmp/rabbit-https-relay-token.txt` contents.
- OpenClaw credentials.
- GitHub tokens.
- Raw private transcripts.
- Screenshots containing secrets.

Gemini must not recommend:

- Disabling relay auth.
- Embedding the token in a QR.
- Rabbit ADB/root/reboot/install/fastboot/recovery/flash/cleanup.
- Release QR activation before Step 2 returns 200/OK.

Codex must not implement:

- Any device-affecting command without fresh explicit user approval.
- Any public exposure/auth change without explicit user approval and rollback.
- Any cleanup that deletes evidence before review.

## Active Handoff To Paste Into Gemini

```text
Use the uploaded Rabbit A1 Broker Test archive as your source set.

Current state:
Codex fixed a Mac relay token-file/process mismatch at commit 3e15f51. The relay
now supports RABBIT_RELAY_TOKEN_FILE and reads
/private/tmp/rabbit-https-relay-token.txt at request time. Local authenticated
checks now pass with HTTP 200 for /health, /bridge/route, and /adb/status.

Release QR is blocked. No Rabbit device commands or privileged actions are
allowed. The next safe user action is only: enter the local token manually in A1
Broker Test, run Step 1 and Step 2, stop, and report endpointStatuses.

Review question:
If Rabbit still reports 401 after this fix, what is the smallest safe diagnostic
that does not expose the token and does not require Rabbit ADB/root/reboot/install?

Use the GEMINI REVIEW response format.
```

## Codex Intake Rules

When the user pastes Gemini output, Codex should:

1. Save a concise summary into `docs/GEMINI-REVIEW-INBOX.md`.
2. Update the matching task in
   `public/broker/assistant-collaboration-board.json`.
3. Implement only the smallest useful change.
4. Preserve the next safe Rabbit test unless evidence changes it.

