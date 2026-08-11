#!/usr/bin/env python3
"""Verify public feature flags stay centralized, parity-safe, and disabled by default."""

from __future__ import annotations

import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
EXPECTED = {
    "food_photo_analysis",
    "health_integrations",
    "community_sharing",
    "store_redemptions",
}


def quoted_flags(path: Path) -> set[str]:
    text = path.read_text(encoding="utf-8")
    return set(re.findall(r'"([a-z]+(?:_[a-z]+)+)"', text)) & EXPECTED


def main() -> int:
    errors: list[str] = []
    sources = (
        ROOT / "backend/app/services/feature_flags.py",
        ROOT / "mobile/featureFlags.ts",
        ROOT / "web/src/featureFlags.ts",
    )
    for source in sources:
        actual = quoted_flags(source)
        if actual != EXPECTED:
            errors.append(f"{source.relative_to(ROOT)} flag parity mismatch: {sorted(actual)}")
        if source != sources[0]:
            content = source.read_text(encoding="utf-8")
            for name in EXPECTED:
                if not re.search(rf"{name}[^\n]*false", content):
                    errors.append(f"{source.relative_to(ROOT)} must default {name} to false")

    backend_config = (ROOT / "backend/app/core/config.py").read_text(encoding="utf-8")
    for name in EXPECTED:
        if f"feature_{name}: bool = False" not in backend_config:
            errors.append(f"backend/app/core/config.py must default FEATURE_{name.upper()} to false")

    for env_path in (ROOT / ".env.example", ROOT / "infra/minimal/.env.example", ROOT / "infra/k8s/configmap.yaml"):
        content = env_path.read_text(encoding="utf-8")
        for name in EXPECTED:
            env_name = f"FEATURE_{name.upper()}"
            if not re.search(rf"{env_name}:?\s*[= ]?\"?false", content):
                errors.append(f"{env_path.relative_to(ROOT)} must keep {env_name}=false")

    main_py = (ROOT / "backend/app/main.py").read_text(encoding="utf-8")
    if '@app.get("/feature-flags")' not in main_py:
        errors.append("backend/app/main.py must expose the public feature flag contract")
    for client in sources[1:]:
        content = client.read_text(encoding="utf-8")
        if 'payload.contract_version !== "1"' not in content or "flags[name] === true" not in content:
            errors.append(f"{client.relative_to(ROOT)} must fail closed on contract/type mismatch")

    if errors:
        print("\n".join(errors))
        return 1
    print("Feature flags verified: backend/web/mobile parity, disabled defaults, and fail-closed client parsing.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
