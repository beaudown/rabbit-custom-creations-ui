# Gemini Review Inbox

Purpose: paste Gemini Notebook or Gemini chat review results here so Codex can
consume them without losing context.

Do not paste relay token values, credentials, raw private transcripts, or
screenshots containing secrets.

## Intake Template

```text
## YYYY-MM-DD - Gemini Review - <short topic>

Source set used:
- <archive or files>

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

Codex disposition:
- Status: pending | accepted | partially accepted | rejected | superseded
- Evidence checked:
- Change made:
- Validation:
- Commit:
```

## 2026-08-19 - Initial Gemini Handoff

Source set used:
- `gemini-rabbit-context-archive-2026-08-19.zip`
- `docs/GEMINI-NOTEBOOK-CONTEXT-ARCHIVE-2026-08-19.md`

Question answered:
How should Gemini and Codex work together without losing context?

Findings:
1. Gemini should be used as a source-grounded reviewer and planning partner.
2. Codex should remain the implementation, validation, commit, and deployment
   agent.
3. The user is the bridge for Gemini output unless a direct connector exists.

Recommended next step:
Upload the Gemini archive, ask the active review question in
`docs/GEMINI-CODEX-COLLABORATION.md`, then paste Gemini's response back to
Codex.

Do not do:
- Do not paste the relay token into Gemini or Codex.
- Do not ask Gemini to approve Rabbit ADB/root/reboot/install/release QR.

Open questions:
- Whether Rabbit Step 2 now reports 200/OK after manual token entry.

Codex disposition:
- Status: accepted
- Evidence checked: repo docs, shared session index, latest commit log
- Change made: created collaboration protocol, inbox, and board
- Validation: pending
- Commit: pending

