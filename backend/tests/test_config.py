import logging
import json

import pytest
from pydantic import ValidationError

from app.core.config import (
    DATABASE_URL_ALLOWED_DRIVERS,
    MAX_CONFIG_URL_LENGTH,
    MAX_CORS_ORIGIN_COUNT,
    MAX_CORS_ORIGIN_LENGTH,
    MAX_MODEL_ID_LENGTH,
    Settings,
)
from app.core.logging import MAX_LOG_STRING_LENGTH, PhiSafeJsonFormatter, configure_logging


def test_local_defaults_enable_dev_auth() -> None:
    settings = Settings(allow_dev_auth=None)

    assert settings.app_env == "local"
    assert settings.dev_auth_enabled is True
    assert settings.enable_debug_tools is False


def test_production_defaults_disable_dev_auth() -> None:
    settings = Settings(
        app_env="production",
        allow_dev_auth=None,
        log_level="info",
        backend_cors_origins="https://app.example.com",
    )

    assert settings.dev_auth_enabled is False


def test_production_rejects_explicit_dev_auth() -> None:
    with pytest.raises(ValidationError, match="ALLOW_DEV_AUTH"):
        Settings(
            app_env="production",
            allow_dev_auth=True,
            log_level="info",
            backend_cors_origins="https://app.example.com",
        )


def test_production_rejects_weak_jwt_secret() -> None:
    with pytest.raises(ValidationError, match="AUTH_JWT_SECRET"):
        Settings(
            app_env="production",
            allow_dev_auth=False,
            auth_jwt_secret="short-secret",
            log_level="info",
            backend_cors_origins="https://app.example.com",
        )


def test_production_requires_issuer_and_audience_when_jwt_secret_is_configured() -> None:
    base_settings = {
        "app_env": "production",
        "allow_dev_auth": False,
        "auth_jwt_secret": "s" * 32,
        "backend_cors_origins": "https://app.example.com",
    }

    with pytest.raises(ValidationError, match="AUTH_JWT_ISSUER"):
        Settings(**base_settings)
    with pytest.raises(ValidationError, match="AUTH_JWT_AUDIENCE"):
        Settings(**base_settings, auth_jwt_issuer="https://issuer.example.com")
    with pytest.raises(ValidationError, match="AUTH_JWT_REQUIRE_JTI"):
        Settings(
            **base_settings,
            auth_jwt_issuer="https://issuer.example.com",
            auth_jwt_audience="bloodsugar-api",
        )

    settings = Settings(
        **base_settings,
        auth_jwt_issuer="  https://issuer.example.com  ",
        auth_jwt_audience="  bloodsugar-api  ",
        auth_jwt_require_jti=True,
    )

    assert settings.auth_jwt_issuer == "https://issuer.example.com"
    assert settings.auth_jwt_audience == "bloodsugar-api"


def test_auth_jwt_config_values_are_bounded_and_normalized() -> None:
    settings = Settings(
        auth_jwt_secret="s" * 4096,
        auth_jwt_issuer="  https://issuer.example.com  ",
        auth_jwt_audience="  bloodsugar-api  ",
    )

    assert settings.auth_jwt_issuer == "https://issuer.example.com"
    assert settings.auth_jwt_audience == "bloodsugar-api"

    with pytest.raises(ValidationError):
        Settings(auth_jwt_secret="s" * 4097)
    with pytest.raises(ValidationError):
        Settings(auth_jwt_issuer="i" * 257)
    with pytest.raises(ValidationError):
        Settings(auth_jwt_audience="a" * 257)


def test_auth_jwks_config_values_are_bounded_and_normalized() -> None:
    settings = Settings(
        auth_jwks_url="  https://issuer.example.com/.well-known/jwks.json  ",
        auth_jwks_timeout_seconds=3,
    )

    assert settings.auth_jwks_url == "https://issuer.example.com/.well-known/jwks.json"
    assert settings.auth_jwks_timeout_seconds == 3

    with pytest.raises(ValidationError, match="AUTH_JWKS_URL"):
        Settings(auth_jwks_url="issuer.example.com/jwks.json")
    with pytest.raises(ValidationError):
        Settings(auth_jwks_url="https://issuer.example.com/" + ("x" * MAX_CONFIG_URL_LENGTH))
    with pytest.raises(ValidationError):
        Settings(auth_jwks_timeout_seconds=0)
    with pytest.raises(ValidationError):
        Settings(auth_jwks_timeout_seconds=31)


def test_production_jwks_requires_https_issuer_audience_and_revocable_jti() -> None:
    base_settings = {
        "app_env": "production",
        "allow_dev_auth": False,
        "auth_jwks_url": "https://issuer.example.com/.well-known/jwks.json",
        "backend_cors_origins": "https://app.example.com",
    }

    with pytest.raises(ValidationError, match="AUTH_JWT_ISSUER"):
        Settings(**base_settings)
    with pytest.raises(ValidationError, match="AUTH_JWT_AUDIENCE"):
        Settings(**base_settings, auth_jwt_issuer="https://issuer.example.com")
    with pytest.raises(ValidationError, match="AUTH_JWT_REQUIRE_JTI"):
        Settings(
            **base_settings,
            auth_jwt_issuer="https://issuer.example.com",
            auth_jwt_audience="bloodsugar-api",
        )
    with pytest.raises(ValidationError, match="AUTH_JWKS_URL"):
        Settings(
            app_env="production",
            allow_dev_auth=False,
            auth_jwks_url="http://issuer.example.com/.well-known/jwks.json",
            backend_cors_origins="https://app.example.com",
            auth_jwt_issuer="https://issuer.example.com",
            auth_jwt_audience="bloodsugar-api",
            auth_jwt_require_jti=True,
        )

    settings = Settings(
        **base_settings,
        auth_jwt_issuer="https://issuer.example.com",
        auth_jwt_audience="bloodsugar-api",
        auth_jwt_require_jti=True,
    )

    assert settings.auth_jwks_url == "https://issuer.example.com/.well-known/jwks.json"


def test_auth_oidc_config_values_are_bounded_and_normalized() -> None:
    settings = Settings(
        auth_oidc_jwks_url="  https://accounts.example.com/.well-known/jwks.json  ",
        auth_oidc_issuer="  https://accounts.example.com  ",
        auth_oidc_audience="  bloodsugar-mobile  ",
        auth_oidc_timeout_seconds=3,
        auth_oidc_max_age_seconds=3600,
    )

    assert settings.auth_oidc_jwks_url == "https://accounts.example.com/.well-known/jwks.json"
    assert settings.auth_oidc_issuer == "https://accounts.example.com"
    assert settings.auth_oidc_audience == "bloodsugar-mobile"
    assert settings.auth_oidc_timeout_seconds == 3
    assert settings.auth_oidc_max_age_seconds == 3600

    with pytest.raises(ValidationError, match="AUTH_JWKS_URL"):
        Settings(auth_oidc_jwks_url="accounts.example.com/jwks.json")
    with pytest.raises(ValidationError):
        Settings(auth_oidc_jwks_url="https://accounts.example.com/" + ("x" * MAX_CONFIG_URL_LENGTH))
    with pytest.raises(ValidationError):
        Settings(auth_oidc_issuer="i" * 257)
    with pytest.raises(ValidationError):
        Settings(auth_oidc_audience="a" * 257)
    with pytest.raises(ValidationError):
        Settings(auth_oidc_timeout_seconds=0)
    with pytest.raises(ValidationError):
        Settings(auth_oidc_max_age_seconds=59)


def test_production_oidc_login_requires_https_claim_config_and_app_token_secret() -> None:
    base_settings = {
        "app_env": "production",
        "allow_dev_auth": False,
        "auth_oidc_jwks_url": "https://accounts.example.com/.well-known/jwks.json",
        "backend_cors_origins": "https://app.example.com",
    }

    with pytest.raises(ValidationError, match="AUTH_OIDC_ISSUER"):
        Settings(**base_settings)
    with pytest.raises(ValidationError, match="AUTH_OIDC_AUDIENCE"):
        Settings(**base_settings, auth_oidc_issuer="https://accounts.example.com")
    with pytest.raises(ValidationError, match="AUTH_JWT_SECRET"):
        Settings(
            **base_settings,
            auth_oidc_issuer="https://accounts.example.com",
            auth_oidc_audience="bloodsugar-mobile",
        )
    with pytest.raises(ValidationError, match="AUTH_OIDC_JWKS_URL"):
        Settings(
            app_env="production",
            allow_dev_auth=False,
            auth_oidc_jwks_url="http://accounts.example.com/.well-known/jwks.json",
            auth_oidc_issuer="https://accounts.example.com",
            auth_oidc_audience="bloodsugar-mobile",
            auth_jwt_secret="s" * 32,
            auth_jwt_issuer="https://api.example.com",
            auth_jwt_audience="bloodsugar-api",
            auth_jwt_require_jti=True,
            backend_cors_origins="https://app.example.com",
        )

    settings = Settings(
        **base_settings,
        auth_oidc_issuer="https://accounts.example.com",
        auth_oidc_audience="bloodsugar-mobile",
        auth_jwt_secret="s" * 32,
        auth_jwt_issuer="https://api.example.com",
        auth_jwt_audience="bloodsugar-api",
        auth_jwt_require_jti=True,
    )

    assert settings.auth_oidc_jwks_url == "https://accounts.example.com/.well-known/jwks.json"


def test_database_url_is_postgresql_and_bounded() -> None:
    settings = Settings(database_url="  postgresql+psycopg://app:app@db:5432/bloodsugar  ")

    assert settings.database_url == "postgresql+psycopg://app:app@db:5432/bloodsugar"
    assert DATABASE_URL_ALLOWED_DRIVERS == frozenset({"postgresql", "postgresql+psycopg"})

    with pytest.raises(ValidationError, match="DATABASE_URL"):
        Settings(database_url="")
    with pytest.raises(ValidationError, match="DATABASE_URL"):
        Settings(database_url="sqlite:///tmp/local.db")
    with pytest.raises(ValidationError, match="DATABASE_URL"):
        Settings(database_url="postgresql+psycopg://app:app@db:5432")
    with pytest.raises(ValidationError):
        Settings(database_url="postgresql+psycopg://app:app@db:5432/" + ("x" * MAX_CONFIG_URL_LENGTH))


def test_production_rejects_wildcard_cors() -> None:
    with pytest.raises(ValidationError, match="Wildcard CORS"):
        Settings(app_env="production", allow_dev_auth=None, backend_cors_origins="*")


def test_cors_origin_config_is_bounded_and_normalized() -> None:
    settings = Settings(backend_cors_origins=" https://app.example.com , http://localhost:5173 ")

    assert settings.backend_cors_origins == "https://app.example.com,http://localhost:5173"
    assert settings.cors_origins == ["https://app.example.com", "http://localhost:5173"]

    with pytest.raises(ValidationError, match="blank origins"):
        Settings(backend_cors_origins="https://app.example.com,")
    with pytest.raises(ValidationError, match="too many origins"):
        Settings(
            backend_cors_origins=",".join(
                f"https://app-{index}.example.com" for index in range(MAX_CORS_ORIGIN_COUNT + 1)
            )
        )
    with pytest.raises(ValidationError, match="oversized origin"):
        Settings(backend_cors_origins=f"https://{'a' * MAX_CORS_ORIGIN_LENGTH}.example.com")


def test_production_rejects_debug_tools() -> None:
    with pytest.raises(ValidationError, match="ENABLE_DEBUG_TOOLS"):
        Settings(
            app_env="production",
            allow_dev_auth=None,
            backend_cors_origins="https://app.example.com",
            enable_debug_tools=True,
        )


def test_log_level_is_validated() -> None:
    with pytest.raises(ValidationError, match="LOG_LEVEL"):
        Settings(log_level="verbose")


def test_request_body_size_limit_is_bounded() -> None:
    assert Settings(max_request_body_bytes=1_024).max_request_body_bytes == 1_024
    with pytest.raises(ValidationError):
        Settings(max_request_body_bytes=1_023)
    with pytest.raises(ValidationError):
        Settings(max_request_body_bytes=10_485_761)


def test_local_llm_max_tokens_is_bounded_to_batch_hard_cap() -> None:
    assert Settings(local_llm_max_tokens=960).local_llm_max_tokens == 960
    with pytest.raises(ValidationError):
        Settings(local_llm_max_tokens=961)


def test_model_runtime_config_strings_are_bounded_and_normalized() -> None:
    settings = Settings(
        gemma4_parser_url="  http://localhost:11434/v1/chat/completions  ",
        gemma4_model_id="  gemma-4-e2b-local-pending  ",
        local_llm_parser_url="  http://ollama:11434/v1/chat/completions  ",
        ollama_chat_url="  http://ollama:11434/api/chat  ",
        ollama_qwen25_model_id="  qwen2.5:1.5b  ",
        local_llm_keep_alive="  10m  ",
    )

    assert settings.gemma4_parser_url == "http://localhost:11434/v1/chat/completions"
    assert settings.local_llm_parser_url == "http://ollama:11434/v1/chat/completions"
    assert settings.ollama_chat_url == "http://ollama:11434/api/chat"
    assert settings.gemma4_model_id == "gemma-4-e2b-local-pending"
    assert settings.ollama_qwen25_model_id == "qwen2.5:1.5b"
    assert settings.local_llm_keep_alive == "10m"

    with pytest.raises(ValidationError):
        Settings(gemma4_model_id="x" * (MAX_MODEL_ID_LENGTH + 1))
    with pytest.raises(ValidationError, match="model id"):
        Settings(ollama_qwen25_model_id="模型 qwen")
    with pytest.raises(ValidationError, match="LOCAL_LLM_KEEP_ALIVE"):
        Settings(local_llm_keep_alive="forever")
    with pytest.raises(ValidationError, match="runtime URL"):
        Settings(ollama_chat_url="ollama:11434/api/chat")
    with pytest.raises(ValidationError):
        Settings(local_llm_parser_url="http://example.com/" + ("x" * MAX_CONFIG_URL_LENGTH))


def test_configure_logging_suppresses_noisy_http_client_debug_logs() -> None:
    configure_logging("debug")

    assert logging.getLogger().getEffectiveLevel() == logging.DEBUG
    assert logging.getLogger("httpcore").getEffectiveLevel() == logging.WARNING
    assert logging.getLogger("httpx").getEffectiveLevel() == logging.WARNING


def test_phi_safe_json_formatter_only_emits_allowlisted_extra_fields() -> None:
    record = logging.LogRecord(
        name="app.request",
        level=logging.INFO,
        pathname=__file__,
        lineno=1,
        msg="request",
        args=(),
        exc_info=None,
    )
    record.request_id = "req-123"
    record.trace_id = "1234567890abcdef1234567890abcdef"
    record.event = "http_request"
    record.method = "POST"
    record.path = "/ai/parse-preview"
    record.status = 200
    record.duration_ms = 12.34
    record.transcript = "should not be serialized"
    record.payload_json = {"value": "glucose-phi-marker"}
    record.headers = {"authorization": "secret"}

    formatted = PhiSafeJsonFormatter().format(record)
    payload = json.loads(formatted)

    assert payload["message"] == "request"
    assert payload["request_id"] == "req-123"
    assert payload["trace_id"] == "1234567890abcdef1234567890abcdef"
    assert payload["event"] == "http_request"
    assert payload["method"] == "POST"
    assert payload["path"] == "/ai/parse-preview"
    assert payload["status"] == 200
    assert payload["duration_ms"] == 12.34
    assert "transcript" not in payload
    assert "payload_json" not in payload
    assert "headers" not in payload
    assert "should not be serialized" not in formatted
    assert "glucose-phi-marker" not in formatted
    assert "secret" not in formatted


def test_phi_safe_json_formatter_bounds_string_fields() -> None:
    long_value = "x" * (MAX_LOG_STRING_LENGTH + 20)
    record = logging.LogRecord(
        name=f"app.request.{long_value}",
        level=logging.INFO,
        pathname=__file__,
        lineno=1,
        msg=long_value,
        args=(),
        exc_info=None,
    )
    record.request_id = long_value
    record.trace_id = long_value
    record.event = long_value
    record.method = "POST"
    record.path = f"/ai/{long_value}"
    record.status = 200
    record.duration_ms = 12.34

    formatted = PhiSafeJsonFormatter().format(record)
    payload = json.loads(formatted)

    assert payload["message"] == "x" * MAX_LOG_STRING_LENGTH
    assert len(payload["logger"]) == MAX_LOG_STRING_LENGTH
    assert payload["request_id"] == "x" * MAX_LOG_STRING_LENGTH
    assert payload["trace_id"] == "x" * MAX_LOG_STRING_LENGTH
    assert payload["event"] == "x" * MAX_LOG_STRING_LENGTH
    assert len(payload["path"]) == MAX_LOG_STRING_LENGTH
