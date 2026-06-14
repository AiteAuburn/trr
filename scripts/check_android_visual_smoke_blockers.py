#!/usr/bin/env python3
"""Record current Android visual-smoke native screenshot blockers.

This diagnostic is read-only and PHI-safe. It checks local disk capacity,
direct Windows adb visibility, AVD names, and whether emulator/qemu processes
are running. It does not launch Android Studio, start an emulator, clear app
data, contact backend services, call AI/LLM/STT/Vision, or touch payments.
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
from pathlib import Path
from typing import Any

DEFAULT_SDK = Path("/mnt/c/Users/robin/AppData/Local/Android/Sdk")
DEFAULT_AVD_ROOT = Path("/mnt/c/Users/robin/.android/avd")
DEFAULT_EVIDENCE = Path("/tmp/bloodsugar-mobile-visual-smoke/2026-06-02-t698-native-blockers/blockers.json")
DEFAULT_DISK_PATHS = (Path("/mnt/c"), Path("/mnt/d"), Path("/tmp"))
CMD_EXE = Path("/mnt/c/Windows/System32/cmd.exe")


def _run(command: list[str], *, timeout: int = 8) -> dict[str, Any]:
    try:
        result = subprocess.run(
            command,
            capture_output=True,
            check=False,
            encoding="utf-8",
            errors="replace",
            timeout=timeout,
        )
    except FileNotFoundError:
        return {"command": command, "available": False, "returncode": None, "stdout": "", "stderr": "not found"}
    except subprocess.TimeoutExpired as exc:
        return {
            "command": command,
            "available": True,
            "returncode": None,
            "stdout": exc.stdout or "",
            "stderr": "timeout",
        }
    return {
        "command": command,
        "available": True,
        "returncode": result.returncode,
        "stdout": result.stdout,
        "stderr": result.stderr,
    }


def _windows_path(path: Path) -> str:
    value = str(path)
    if value.startswith("/mnt/c/"):
        return "C:\\" + value.removeprefix("/mnt/c/").replace("/", "\\")
    return value


def _run_windows_exe(path: Path, args: list[str], *, timeout: int = 8) -> dict[str, Any]:
    direct_command = [str(path), *args]
    result = _run(direct_command, timeout=timeout)
    stderr = str(result.get("stderr", ""))
    if result.get("returncode") == 0 or not CMD_EXE.exists() or "UtilBindVsockAnyPort" not in stderr:
        return result

    command_text = " ".join([_windows_path(path), *args])
    fallback = _run([str(CMD_EXE), "/c", command_text], timeout=timeout)
    fallback["fallback_from"] = direct_command
    return fallback


def _disk(path: Path) -> dict[str, Any]:
    exists = path.exists()
    if not exists:
        return {"path": str(path), "exists": False}
    usage = shutil.disk_usage(path)
    available_mb = round(usage.free / 1024 / 1024, 1)
    total_mb = round(usage.total / 1024 / 1024, 1)
    used_percent = round(((usage.total - usage.free) / usage.total) * 100, 1)
    return {
        "path": str(path),
        "exists": True,
        "total_mb": total_mb,
        "available_mb": available_mb,
        "used_percent": used_percent,
        "low_space_for_avd": path == Path("/mnt/c") and usage.free < 5 * 1024 * 1024 * 1024,
    }


def _parse_adb_devices(stdout: str) -> list[dict[str, str]]:
    devices: list[dict[str, str]] = []
    for line in stdout.splitlines()[1:]:
        line = line.strip()
        if not line:
            continue
        parts = line.split()
        if len(parts) < 2:
            continue
        devices.append({"serial": parts[0], "state": parts[1], "details": " ".join(parts[2:])})
    return devices


def _parse_avds(stdout: str) -> list[str]:
    return [line.strip() for line in stdout.splitlines() if line.strip()]


def _avd_names_from_files(avd_root: Path) -> list[str]:
    if not avd_root.exists():
        return []
    return sorted(path.stem.removesuffix(".avd") for path in avd_root.glob("*.avd") if path.is_dir())


def _parse_android_processes(stdout: str) -> list[str]:
    process_names = ("emulator", "qemu", "adb.exe", "studio64.exe")
    matches: list[str] = []
    for line in stdout.splitlines():
        lowered = line.lower()
        if any(name in lowered for name in process_names):
            matches.append(line.rstrip())
    return matches


def _has_wsl_vsock_error(result: dict[str, Any]) -> bool:
    return "UtilBindVsockAnyPort" in str(result.get("stderr", ""))


def inspect(sdk_root: Path, avd_root: Path, disk_paths: tuple[Path, ...]) -> dict[str, Any]:
    adb = sdk_root / "platform-tools" / "adb.exe"
    emulator = sdk_root / "emulator" / "emulator.exe"
    tasklist = Path("/mnt/c/Windows/System32/cmd.exe")

    adb_result = _run_windows_exe(adb, ["devices", "-l"]) if adb.exists() else {
        "command": [str(adb), "devices", "-l"],
        "available": False,
        "returncode": None,
        "stdout": "",
        "stderr": "adb.exe missing",
    }
    avd_result = _run_windows_exe(emulator, ["-list-avds"]) if emulator.exists() else {
        "command": [str(emulator), "-list-avds"],
        "available": False,
        "returncode": None,
        "stdout": "",
        "stderr": "emulator.exe missing",
    }
    tasklist_result = _run([str(tasklist), "/c", "tasklist"], timeout=12) if tasklist.exists() else {
        "command": [str(tasklist), "/c", "tasklist"],
        "available": False,
        "returncode": None,
        "stdout": "",
        "stderr": "cmd.exe missing",
    }

    disks = [_disk(path) for path in disk_paths]
    adb_collection_unavailable = _has_wsl_vsock_error(adb_result)
    emulator_collection_unavailable = _has_wsl_vsock_error(avd_result)
    tasklist_collection_unavailable = _has_wsl_vsock_error(tasklist_result)
    devices = [] if adb_collection_unavailable else _parse_adb_devices(adb_result["stdout"])
    avds_from_command = [] if emulator_collection_unavailable else _parse_avds(avd_result["stdout"])
    avds_from_files = _avd_names_from_files(avd_root)
    avds = avds_from_command or avds_from_files
    android_processes = [] if tasklist_collection_unavailable else _parse_android_processes(tasklist_result["stdout"])

    blockers = []
    c_disk = next((disk for disk in disks if disk.get("path") == "/mnt/c"), None)
    if c_disk and c_disk.get("low_space_for_avd"):
        blockers.append("Windows C: disk has less than 5GB free; Android emulator/AVD startup may fail")
    if not adb.exists():
        blockers.append("adb.exe is missing")
    elif adb_collection_unavailable:
        blockers.append("adb.exe runtime collection is unavailable from Python subprocess; retry direct shell adb.exe")
    elif adb_result["returncode"] not in {0, None}:
        blockers.append("adb.exe returned a non-zero status")
    elif not devices:
        blockers.append("direct adb.exe sees no connected emulator/device")
    if not emulator.exists():
        blockers.append("emulator.exe is missing")
    elif not avds:
        blockers.append("no AVD names reported by emulator.exe -list-avds")
    if tasklist_collection_unavailable:
        blockers.append("Windows tasklist collection is unavailable from Python subprocess; retry direct shell cmd.exe")
    elif not any("emulator" in line.lower() or "qemu" in line.lower() for line in android_processes):
        blockers.append("no running emulator/qemu process found in Windows tasklist")

    ready_for_native_capture = not blockers and any(device["state"] == "device" for device in devices)

    return {
        "kind": "android_visual_smoke_blockers",
        "sdk_root": str(sdk_root),
        "disk": disks,
        "adb": {
            "exists": adb.exists(),
            "returncode": adb_result["returncode"],
            "collection_unavailable": adb_collection_unavailable,
            "devices": devices,
            "stderr": adb_result["stderr"],
        },
        "emulator": {
            "exists": emulator.exists(),
            "returncode": avd_result["returncode"],
            "collection_unavailable": emulator_collection_unavailable,
            "avds": avds,
            "avds_from_command": avds_from_command,
            "avds_from_files": avds_from_files,
            "stderr": avd_result["stderr"],
        },
        "tasklist_collection_unavailable": tasklist_collection_unavailable,
        "windows_android_processes": android_processes,
        "ready_for_native_capture": ready_for_native_capture,
        "blockers": blockers,
        "safety": {
            "read_only": True,
            "phi_safe": True,
            "backend_calls": False,
            "database_writes": False,
            "ai_llm_stt_vision_calls": False,
            "payment_calls": False,
            "production_credentials": False,
            "emulator_started": False,
            "app_data_cleared": False,
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--sdk-root", type=Path, default=DEFAULT_SDK)
    parser.add_argument("--avd-root", type=Path, default=DEFAULT_AVD_ROOT)
    parser.add_argument("--evidence", type=Path, default=DEFAULT_EVIDENCE)
    args = parser.parse_args()

    evidence = inspect(args.sdk_root, args.avd_root, DEFAULT_DISK_PATHS)
    args.evidence.parent.mkdir(parents=True, exist_ok=True)
    args.evidence.write_text(json.dumps(evidence, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(evidence, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
