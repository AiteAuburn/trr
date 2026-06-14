#!/usr/bin/env python3
"""Static guardrails for Kubernetes production manifests."""

from __future__ import annotations

import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
K8S_DIR = REPO_ROOT / "infra" / "k8s"


def _read(name: str) -> str:
    return (K8S_DIR / name).read_text(encoding="utf-8")


def _require(content: str, needle: str, *, file_name: str, errors: list[str]) -> None:
    if needle not in content:
        errors.append(f"infra/k8s/{file_name} missing: {needle}")


def _require_absent(content: str, needle: str, *, file_name: str, errors: list[str]) -> None:
    if needle in content:
        errors.append(f"infra/k8s/{file_name} must not contain: {needle}")


def _require_all(file_name: str, needles: list[str], errors: list[str]) -> None:
    content = _read(file_name)
    for needle in needles:
        _require(content, needle, file_name=file_name, errors=errors)


def main() -> int:
    errors: list[str] = []
    required_files = [
        "namespace.yaml",
        "serviceaccount.yaml",
        "configmap.yaml",
        "secret.example.yaml",
        "external-secret.example.yaml",
        "backend.yaml",
        "web.yaml",
        "ingress.yaml",
        "hpa.yaml",
        "pdb.yaml",
        "networkpolicy.yaml",
        "migration-job.yaml",
        "year-review-cronjob.yaml",
    ]
    for file_name in required_files:
        if not (K8S_DIR / file_name).is_file():
            errors.append(f"infra/k8s/{file_name} is missing")

    _require_all(
        "backend.yaml",
        [
            "kind: Deployment",
            "name: bloodsugar-backend",
            "replicas: 2",
            "type: RollingUpdate",
            "maxUnavailable: 0",
            "serviceAccountName: bloodsugar-backend",
            "runAsNonRoot: true",
            "readOnlyRootFilesystem: true",
            "allowPrivilegeEscalation: false",
            'drop: ["ALL"]',
            "requests:",
            "limits:",
            "livenessProbe:",
            "path: /healthz",
            "readinessProbe:",
            "path: /readyz",
            "configMapRef:",
            "secretRef:",
            "kind: Service",
            "type: ClusterIP",
        ],
        errors,
    )
    _require_all(
        "web.yaml",
        [
            "kind: Deployment",
            "name: bloodsugar-web",
            "replicas: 2",
            "type: RollingUpdate",
            "maxUnavailable: 0",
            "runAsNonRoot: true",
            "readOnlyRootFilesystem: true",
            "allowPrivilegeEscalation: false",
            'drop: ["ALL"]',
            "requests:",
            "limits:",
            "kind: Service",
            "type: ClusterIP",
        ],
        errors,
    )
    _require_all(
        "hpa.yaml",
        [
            "kind: HorizontalPodAutoscaler",
            "apiVersion: autoscaling/v2",
            "minReplicas: 2",
            "maxReplicas: 10",
            "name: cpu",
            "averageUtilization: 70",
            "name: memory",
            "averageUtilization: 80",
        ],
        errors,
    )
    _require_all(
        "pdb.yaml",
        [
            "kind: PodDisruptionBudget",
            "name: bloodsugar-backend",
            "name: bloodsugar-web",
            "minAvailable: 1",
        ],
        errors,
    )
    _require_all(
        "networkpolicy.yaml",
        [
            "kind: NetworkPolicy",
            "name: bloodsugar-default-deny-ingress",
            "podSelector: {}",
            "name: bloodsugar-allow-ingress-to-app",
            'values: ["backend", "web"]',
            "port: 8000",
            "port: 8080",
        ],
        errors,
    )
    _require_all(
        "ingress.yaml",
        [
            "kind: Ingress",
            "nginx.ingress.kubernetes.io/ssl-redirect: \"true\"",
            "nginx.ingress.kubernetes.io/limit-rps:",
            "tls:",
            "secretName: bloodsugar-tls",
            "path: /api",
            "name: bloodsugar-backend",
            "path: /",
            "name: bloodsugar-web",
        ],
        errors,
    )
    _require_all(
        "migration-job.yaml",
        [
            "kind: Job",
            "backoffLimit: 1",
            "restartPolicy: Never",
            "serviceAccountName: bloodsugar-backend",
            'command: ["alembic", "upgrade", "head"]',
            "runAsNonRoot: true",
            "readOnlyRootFilesystem: true",
            "allowPrivilegeEscalation: false",
            'drop: ["ALL"]',
            "requests:",
            "limits:",
            "configMapRef:",
            "secretRef:",
        ],
        errors,
    )
    _require_all(
        "year-review-cronjob.yaml",
        [
            "kind: CronJob",
            "name: bloodsugar-year-review-snapshots",
            'schedule: "15 0 1 1 *"',
            "concurrencyPolicy: Forbid",
            "successfulJobsHistoryLimit: 2",
            "failedJobsHistoryLimit: 3",
            "backoffLimit: 1",
            "restartPolicy: Never",
            "serviceAccountName: bloodsugar-backend",
            'command: ["python", "-m", "app.jobs.generate_year_review_snapshots"]',
            "runAsNonRoot: true",
            "readOnlyRootFilesystem: true",
            "allowPrivilegeEscalation: false",
            'drop: ["ALL"]',
            "requests:",
            "limits:",
            "configMapRef:",
            "secretRef:",
        ],
        errors,
    )
    _require_absent(
        _read("year-review-cronjob.yaml"),
        "--year",
        file_name="year-review-cronjob.yaml",
        errors=errors,
    )
    _require_all(
        "configmap.yaml",
        [
            'APP_ENV: "production"',
            'ENABLE_DEBUG_TOOLS: "false"',
            'ALLOW_DEV_AUTH: "false"',
            'LOCAL_LLM_MAX_TOKENS: "900"',
        ],
        errors,
    )

    if errors:
        for error in errors:
            print(error, file=sys.stderr)
        return 1

    print("Kubernetes manifests verified.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
