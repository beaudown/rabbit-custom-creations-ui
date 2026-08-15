# Broker Workflow Reference

## Request Flow

1. Rabbit Creation opens the GitHub Pages UI by QR or creation link.
2. UI loads prompt packs, file manifests, settings, and broker request templates
   from GitHub.
3. User chooses a workflow from the Creation. The Creation is allowed to call
   root-related workflows by creating broker requests.
4. UI creates a broker request JSON with a unique request ID.
5. Broker validates the request and writes an audit record.
6. Broker shows approve/deny for any privileged or persistent action.
7. Broker executes only allowlisted actions after live device checks.
8. Broker writes result, rollback notes, and post-check records.

## Required Request Fields

- `schemaVersion`
- `requestId`
- `createdAt`
- `source`
- `action`
- `risk`
- `requiresApproval`
- `requiresLiveDeviceCheck`
- `dryRun`
- `ttlSeconds`
- `persistenceExpected`
- `rollbackPlan`
- `artifacts`

## Safe Actions

- `open_prompt_library`
- `open_file_library`
- `generate_qr`
- `prepare_apk_canary_request`
- `prepare_storage_export_request`
- `prepare_reboot_request`
- `prepare_adb_enable_request`
- `prepare_usb_mass_storage_request`
- `request_temporary_privilege_session`
- `show_device_state_checklist`

`request_temporary_privilege_session` may be requested by the Creation and may reference a validated local,
non-persistent payload by hash and compatibility metadata. The executor must be
the local broker, not the Rabbit Creation or GitHub Pages UI.

`prepare_usb_mass_storage_request` means "discover and request the safest
supported mode for exposing Rabbit storage to the USB-connected host." Do not
claim true USB mass storage is available until the broker verifies it live. The
discovery path should check Android file transfer/MTP, recovery mount options,
MediaTek/Preloader-visible storage paths, read-only export paths, and USB mass
storage only if the exact mode is supported.

## Blocked Defaults

Block by default unless a future, separately validated local broker policy
explicitly allows them:

- arbitrary shell;
- direct Creation-side root or su execution that bypasses broker approval;
- GitHub-hosted root injection;
- flash, erase, slot change;
- persistent root or OTA-breaking software modification;
- direct ADB authorization from a Creation;
- low-level session without the required normal stock boot/shutdown gate.

## Queryable Archives

Archive files should be easy to search for rollback and debugging:

- Prefer JSONL chunks named by time range:
  `audit-archive-YYYYMMDD-HHMMSS-YYYYMMDD-HHMMSS.jsonl`
- Add archive entries to the manifest with:
  `file`, `recordCount`, `sha256`, `firstRecordId`, `lastRecordId`,
  `startTime`, `endTime`, `tags`, and `summary`.
- Keep tags short: `adb`, `storage`, `reboot`, `apk`, `prompt`, `blocked`,
  `rollback`, `dry-run`, `privilege`.
- Do not archive secrets.
