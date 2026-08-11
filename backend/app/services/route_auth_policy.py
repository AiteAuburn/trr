from __future__ import annotations


# Public and token-exchange routes require explicit review here. Every other API
# route must depend on get_current_account; the coverage test fails new routes closed.
PUBLIC_ROUTE_REASONS: dict[tuple[str, str], str] = {
    ("GET", "/health"): "legacy load-balancer health check",
    ("GET", "/healthz"): "process liveness probe",
    ("GET", "/readyz"): "traffic readiness probe",
    ("GET", "/metrics"): "cluster-internal metrics scrape",
    ("GET", "/version"): "PHI-safe release identity",
    ("GET", "/feature-flags"): "public fail-closed feature availability",
    ("POST", "/auth/dev-login"): "environment-gated local/test login",
    ("POST", "/auth/oidc-login"): "rate-limited identity-token exchange",
    ("POST", "/auth/refresh"): "rate-limited rotating refresh-token exchange",
    ("POST", "/auth/logout"): "rate-limited refresh-token revocation",
    ("POST", "/dev/reset-data"): "environment-and-confirmation-gated development reset",
}
