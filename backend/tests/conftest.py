"""Pin the settings the test suite depends on.

docker compose passes the developer's root .env into the container, and the
compose default for ALLOW_DEV_AUTH is false. Tests log in through
/auth/dev-login and expect auth, admin and hosted-model settings to start
unset, so set them here before app modules read get_settings(). Individual
tests still override these with monkeypatch.
"""

import os

TEST_ENV_OVERRIDES = {
    "APP_ENV": "local",
    "ALLOW_DEV_AUTH": "true",
    "ENABLE_DEBUG_TOOLS": "false",
    "AUTH_JWT_SECRET": "",
    "AUTH_JWT_ISSUER": "",
    "AUTH_JWT_AUDIENCE": "",
    "AUTH_JWKS_URL": "",
    "AUTH_JWT_REQUIRE_JTI": "false",
    "AUTH_OIDC_JWKS_URL": "",
    "AUTH_OIDC_ISSUER": "",
    "AUTH_OIDC_AUDIENCE": "",
    "ADMIN_USERNAME": "",
    "ADMIN_PASSWORD_HASH": "",
    "ADMIN_SESSION_SECRET": "",
    # Never let the suite reach a real hosted model with a developer key.
    "DEEPSEEK_API_KEY": "",
    "DEEPSEEK_PARSER_URL": "",
    "GEMMA4_PARSER_URL": "",
    "LOCAL_LLM_REPAIR_FALLBACK_ENABLED": "false",
}

os.environ.update(TEST_ENV_OVERRIDES)
