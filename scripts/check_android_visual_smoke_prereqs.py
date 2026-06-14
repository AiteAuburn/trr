#!/usr/bin/env python3
"""Check local Android prerequisites for mobile visual-smoke screenshots.

The check is intentionally read-only and PHI-safe. It inspects the Windows SDK
layout from WSL and optionally records adb/emulator state without touching app
data, backend services, AI, LLM, STT, Vision, payment, or credentials.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any

DEFAULT_SDK = Path("/mnt/c/Users/robin/AppData/Local/Android/Sdk")
DEFAULT_AVD = Path("/mnt/c/Users/robin/.android/avd")


def _read_properties(path: Path) -> dict[str, str]:
    values: dict[str, str] = {}
    if not path.exists():
        return values
    for line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        if not line or line.lstrip().startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        values[key.strip()] = value.strip()
    return values


def _rel(path: Path, root: Path) -> str:
    try:
        return str(path.relative_to(root))
    except ValueError:
        return str(path)


def inspect(sdk_root: Path, avd_root: Path) -> dict[str, Any]:
    system_images: list[dict[str, Any]] = []
    system_root = sdk_root / "system-images"
    if system_root.exists():
        for image_dir in sorted(path for path in system_root.glob("*/*/*") if path.is_dir()):
            relative = _rel(image_dir, system_root)
            lower_relative = relative.lower()
            system_images.append(
                {
                    "path": relative,
                    "page_size_16kb": "16k" in lower_relative or "ps16k" in lower_relative,
                }
            )

    avds: list[dict[str, Any]] = []
    if avd_root.exists():
        for config_path in sorted(avd_root.glob("*.avd/config.ini")):
            config = _read_properties(config_path)
            image = config.get("image.sysdir.1", "")
            tags = ",".join(
                value
                for key, value in config.items()
                if key in {"tag.display", "tag.displaynames", "tag.id", "tag.ids"}
            ).lower()
            avds.append(
                {
                    "name": config.get("AvdId", config_path.parent.stem.replace(".avd", "")),
                    "target": config.get("target", ""),
                    "abi": config.get("abi.type", ""),
                    "image_sysdir": image,
                    "page_size_16kb": "16k" in image.lower() or "16kb" in tags or "page_size_16kb" in tags,
                }
            )

    tools = {
        "emulator": (sdk_root / "emulator" / "emulator.exe").exists(),
        "adb": (sdk_root / "platform-tools" / "adb.exe").exists(),
        "sdkmanager": (sdk_root / "cmdline-tools" / "latest" / "bin" / "sdkmanager.bat").exists(),
        "avdmanager": (sdk_root / "cmdline-tools" / "latest" / "bin" / "avdmanager.bat").exists(),
    }

    has_non_16kb_image = any(not image["page_size_16kb"] for image in system_images)
    has_non_16kb_avd = any(not avd["page_size_16kb"] for avd in avds)

    return {
        "sdk_root": str(sdk_root),
        "avd_root": str(avd_root),
        "tools": tools,
        "system_images": system_images,
        "avds": avds,
        "adb_devices": "not collected by default; run Windows adb directly when native screenshot capture is attempted",
        "native_screenshot_ready": bool(tools["emulator"] and tools["adb"] and has_non_16kb_avd),
        "blockers": [
            blocker
            for blocker, active in [
                ("cmdline-tools sdkmanager/avdmanager not installed", not tools["sdkmanager"] or not tools["avdmanager"]),
                ("no non-16 KB system image installed", not has_non_16kb_image),
                ("no non-16 KB AVD configured", not has_non_16kb_avd),
            ]
            if active
        ],
        "safety": {
            "read_only": True,
            "phi_safe": True,
            "backend_calls": False,
            "database_writes": False,
            "ai_llm_stt_vision_calls": False,
            "payment_calls": False,
            "production_credentials": False,
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--sdk-root", type=Path, default=DEFAULT_SDK)
    parser.add_argument("--avd-root", type=Path, default=DEFAULT_AVD)
    parser.add_argument("--evidence", type=Path)
    args = parser.parse_args()

    evidence = inspect(args.sdk_root, args.avd_root)
    if args.evidence is not None:
        args.evidence.parent.mkdir(parents=True, exist_ok=True)
        args.evidence.write_text(
            json.dumps(evidence, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
    print(json.dumps(evidence, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
