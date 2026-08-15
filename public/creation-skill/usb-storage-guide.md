# USB Storage Mode Guide

Use this guide when the user asks to expose Rabbit storage over USB or when
mounting from another device fails.

## Goal

Help the broker discover what Rabbit storage can safely expose to the connected
USB host. Do not assume true USB mass storage is available until the broker
confirms it.

## Walkthrough

1. Confirm the target host device is connected or ready to connect by USB.
2. Ask whether the user wants dry run or approved action.
3. Check live Rabbit identity, build, slot, current mode, and USB enumeration.
4. Discover supported exposure paths:
   - Android file transfer or MTP.
   - Recovery mount options.
   - MediaTek or Preloader-visible storage paths.
   - Read-only export path.
   - USB mass-storage mode, only if supported.
5. Prefer read-only exposure when possible.
6. Tell the user what to look for on the external host:
   - New mounted drive.
   - File-transfer prompt.
   - Recovery storage entry.
   - No new device, timeout, or permission error.
7. If mounting fails, record the exact symptom and point to the next check:
   - Cable or port not enumerating.
   - Device in wrong mode.
   - Host permission denied.
   - rabbitOS mode unsupported.
   - Storage exposed read-only.
   - Broker requires normal reboot/reset gate first.
8. Log the audit record ID and whether anything changed.

## User-facing error hints

- "No USB device found": reconnect cable, verify host sees Rabbit, retry live
  enumeration.
- "Mode unsupported": use MTP, recovery mount, or read-only export fallback.
- "Permission denied": check host-side permissions and whether storage is
  exposed read-only.
- "Needs reset gate": boot normal stock rabbitOS, shut down normally, then retry
  with a fresh broker/browser process.
- "Mount appeared empty": record path, mode, and whether protected/userdata
  storage is intentionally unavailable.

## Safety

Do not write, erase, repartition, or change slots as part of storage discovery.
Do not claim success until the external host sees the exposed storage or the
broker records a verified fallback path.
