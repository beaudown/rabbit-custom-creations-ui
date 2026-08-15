#!/usr/bin/env python3
import json
import re
import sys
from pathlib import Path

SAFE_ACTIONS = {
    "open_prompt_library",
    "open_file_library",
    "generate_qr",
    "prepare_apk_canary_request",
    "prepare_storage_export_request",
    "prepare_reboot_request",
    "prepare_adb_enable_request",
    "prepare_adb_tcpip_request",
    "prepare_usb_mass_storage_request",
    "prepare_broker_service_control_request",
    "prepare_custom_skill_upload_request",
    "request_temporary_privilege_session",
    "show_device_state_checklist",
}

BLOCKED_ACTION_TERMS = (
    "arbitrary_shell",
    "creation_side_root_execution",
    "github_root_injection",
    "flash_partition",
    "erase_partition",
    "slot_change",
    "persistent_root",
    "ota_breaking_modification",
)

SECRET_PATTERN = re.compile(
    r"(ghp_|github_pat_|sk-[A-Za-z0-9]|token\\s*[:=]|password\\s*[:=]|secret\\s*[:=])",
    re.IGNORECASE,
)


def fail(message: str) -> None:
    print(f"INVALID: {message}", file=sys.stderr)
    raise SystemExit(1)


def walk_values(value):
    if isinstance(value, dict):
        for item in value.values():
            yield from walk_values(item)
    elif isinstance(value, list):
        for item in value:
            yield from walk_values(item)
    else:
        yield value


def main() -> None:
    if len(sys.argv) != 2:
        fail("usage: validate_broker_request.py <request.json>")

    path = Path(sys.argv[1])
    data = json.loads(path.read_text())

    required = {
        "schemaVersion",
        "requestId",
        "createdAt",
        "source",
        "action",
        "risk",
        "requiresApproval",
        "requiresLiveDeviceCheck",
        "dryRun",
        "ttlSeconds",
        "persistenceExpected",
        "rollbackPlan",
        "artifacts",
    }
    missing = sorted(required - set(data))
    if missing:
        fail(f"missing required fields: {', '.join(missing)}")

    action = data["action"]
    if action not in SAFE_ACTIONS:
        fail(f"action is not allowlisted: {action}")

    text = json.dumps(data, sort_keys=True)
    for term in BLOCKED_ACTION_TERMS:
        if term in text:
            fail(f"blocked term present: {term}")

    for value in walk_values(data):
        if isinstance(value, str) and SECRET_PATTERN.search(value):
            fail("secret-looking value present")

    risk = data["risk"]
    if risk not in {"low", "medium", "high"}:
        fail("risk must be low, medium, or high")

    if risk in {"medium", "high"} and not data["requiresApproval"]:
        fail("medium/high risk requests require approval")

    if action in {
        "request_temporary_privilege_session",
        "prepare_reboot_request",
        "prepare_adb_enable_request",
        "prepare_adb_tcpip_request",
        "prepare_storage_export_request",
        "prepare_usb_mass_storage_request",
        "prepare_broker_service_control_request",
        "prepare_custom_skill_upload_request",
    }:
        if not data["requiresLiveDeviceCheck"]:
            fail("privileged/reboot requests require live device checks")
        session_scope = data.get("sessionScope", {})
        restart_scoped = (
            action == "request_temporary_privilege_session"
            and session_scope.get("lifetime") == "until_reboot"
            and session_scope.get("expiresOn") == "device_restart"
        )
        if data["ttlSeconds"] > 600 and not restart_scoped:
            fail("privileged/reboot request TTL must be 600 seconds or less")

    if action == "request_temporary_privilege_session":
        source = data.get("source", {})
        if source.get("executor") in {"rabbit_creation", "github_pages"}:
            fail("temporary privilege may be requested by Creation/GitHub, but execution must be broker-side")
        session_scope = data.get("sessionScope", {})
        if session_scope.get("lifetime") != "until_reboot":
            fail("temporary privilege sessions must be restart-scoped")
        if session_scope.get("initialAuthorizationTiming") != "after_device_restart":
            fail("temporary privilege initial authorization must happen after device restart")

    if data["persistenceExpected"] and risk != "high":
        fail("persistent changes must be high risk")

    rollback = data["rollbackPlan"]
    if risk in {"medium", "high"} and not str(rollback).strip():
        fail("medium/high risk requests require rollback notes")

    print(f"VALID: {path}")


if __name__ == "__main__":
    main()
