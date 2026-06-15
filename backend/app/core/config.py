from functools import lru_cache
import re
from typing import Literal

from pydantic import AnyUrl, Field, field_validator, model_validator
from pydantic_core import ValidationError as PydanticCoreValidationError
from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.engine import make_url
from sqlalchemy.exc import ArgumentError


RuntimeEnv = Literal["local", "test", "development", "staging", "production"]
MAX_CORS_ORIGINS_LENGTH = 2048
MAX_CORS_ORIGIN_COUNT = 32
MAX_CORS_ORIGIN_LENGTH = 256
MAX_CONFIG_URL_LENGTH = 2048
MAX_MODEL_ID_LENGTH = 120
MAX_KEEP_ALIVE_LENGTH = 32
DATABASE_URL_ALLOWED_DRIVERS = frozenset({"postgresql", "postgresql+psycopg"})
MODEL_ID_PATTERN = re.compile(r"^[A-Za-z0-9._:/+-]+$")
KEEP_ALIVE_PATTERN = re.compile(r"^(-1|0|[0-9]{1,6}(ms|s|m|h))$")


class Settings(BaseSettings):
    app_env: RuntimeEnv = "local"
    log_level: str = "debug"
    database_url: str = Field(
        default="postgresql+psycopg://app:app@db:5432/bloodsugar",
        max_length=MAX_CONFIG_URL_LENGTH,
    )
    backend_cors_origins: str = Field(
        default="http://localhost:5173,http://127.0.0.1:5173",
        max_length=MAX_CORS_ORIGINS_LENGTH,
    )
    allow_dev_auth: bool | None = None
    auth_jwt_secret: str = Field(default="", max_length=4096)
    auth_jwt_issuer: str = Field(default="", max_length=256)
    auth_jwt_audience: str = Field(default="", max_length=256)
    auth_jwks_url: str = Field(default="", max_length=MAX_CONFIG_URL_LENGTH)
    auth_jwks_timeout_seconds: int = Field(default=5, ge=1, le=30)
    auth_jwt_max_age_seconds: int = Field(default=900, ge=60, le=86_400)
    auth_jwt_require_jti: bool = False
    auth_oidc_jwks_url: str = Field(default="", max_length=MAX_CONFIG_URL_LENGTH)
    auth_oidc_issuer: str = Field(default="", max_length=256)
    auth_oidc_audience: str = Field(default="", max_length=256)
    auth_oidc_timeout_seconds: int = Field(default=5, ge=1, le=30)
    auth_oidc_max_age_seconds: int = Field(default=3600, ge=60, le=86_400)
    auth_login_client_rate_limit_count: int = Field(default=30, ge=1, le=10_000)
    auth_login_client_rate_limit_window_seconds: int = Field(default=60, ge=1, le=86_400)
    auth_refresh_token_days: int = Field(default=30, ge=1, le=365)
    auth_refresh_rate_limit_count: int = Field(default=10, ge=1, le=1_000)
    auth_refresh_rate_limit_window_seconds: int = Field(default=60, ge=1, le=86_400)
    auth_refresh_client_rate_limit_count: int = Field(default=60, ge=1, le=10_000)
    auth_refresh_client_rate_limit_window_seconds: int = Field(default=60, ge=1, le=86_400)
    auth_logout_client_rate_limit_count: int = Field(default=120, ge=1, le=10_000)
    auth_logout_client_rate_limit_window_seconds: int = Field(default=60, ge=1, le=86_400)
    ai_parse_rate_limit_count: int = Field(default=120, ge=1, le=10_000)
    ai_parse_rate_limit_window_seconds: int = Field(default=60, ge=1, le=86_400)
    max_request_body_bytes: int = Field(default=1_048_576, ge=1_024, le=10_485_760)
    gemma4_parser_url: str = Field(default="", max_length=MAX_CONFIG_URL_LENGTH)
    gemma4_model_id: str = Field(default="gemma-4-e2b-local-pending", max_length=MAX_MODEL_ID_LENGTH)
    gemma4_timeout_seconds: float = Field(default=60.0, gt=0, le=300)
    local_llm_parser_url: str = Field(
        default="http://ollama:11434/v1/chat/completions",
        max_length=MAX_CONFIG_URL_LENGTH,
    )
    deepseek_parser_url: str = Field(default="", max_length=MAX_CONFIG_URL_LENGTH)
    deepseek_api_key: str = Field(default="", max_length=4096)
    deepseek_model_id: str = Field(default="deepseek-chat", max_length=MAX_MODEL_ID_LENGTH)
    ollama_chat_url: str = Field(default="http://ollama:11434/api/chat", max_length=MAX_CONFIG_URL_LENGTH)
    local_llm_keep_alive: str = Field(default="30m", max_length=MAX_KEEP_ALIVE_LENGTH)
    local_llm_max_tokens: int = Field(default=960, ge=1, le=960)
    local_llm_timeout_seconds: float = Field(default=120.0, gt=0, le=300)
    local_llm_repair_fallback_enabled: bool = False
    enable_debug_tools: bool = False
    ollama_qwen25_model_id: str = Field(default="qwen2.5:1.5b", max_length=MAX_MODEL_ID_LENGTH)
    ollama_gemma3_model_id: str = Field(default="gemma3:1b", max_length=MAX_MODEL_ID_LENGTH)
    ollama_llama32_model_id: str = Field(default="llama3.2:1b", max_length=MAX_MODEL_ID_LENGTH)

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @field_validator("log_level")
    @classmethod
    def validate_log_level(cls, value: str) -> str:
        normalized = value.lower()
        allowed = {"debug", "info", "warning", "error", "critical"}
        if normalized not in allowed:
            raise ValueError(f"LOG_LEVEL must be one of: {', '.join(sorted(allowed))}")
        return normalized

    @field_validator("backend_cors_origins")
    @classmethod
    def validate_cors_origins_string(cls, value: str) -> str:
        origins = [origin.strip() for origin in value.split(",")]
        if any(not origin for origin in origins):
            raise ValueError("BACKEND_CORS_ORIGINS must not contain blank origins")
        if len(origins) > MAX_CORS_ORIGIN_COUNT:
            raise ValueError("BACKEND_CORS_ORIGINS has too many origins")
        if any(len(origin) > MAX_CORS_ORIGIN_LENGTH for origin in origins):
            raise ValueError("BACKEND_CORS_ORIGINS contains an oversized origin")
        if not value.strip():
            raise ValueError("BACKEND_CORS_ORIGINS must not be empty")
        return ",".join(origins)

    @field_validator("database_url")
    @classmethod
    def validate_database_url(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("DATABASE_URL must not be empty")
        try:
            parsed = make_url(normalized)
        except ArgumentError as exc:
            raise ValueError("DATABASE_URL must be a valid SQLAlchemy URL") from exc
        if parsed.drivername not in DATABASE_URL_ALLOWED_DRIVERS:
            raise ValueError("DATABASE_URL must use a supported PostgreSQL driver")
        if not parsed.database:
            raise ValueError("DATABASE_URL must include a database name")
        return normalized

    @field_validator("auth_jwt_issuer", "auth_jwt_audience", "auth_oidc_issuer", "auth_oidc_audience")
    @classmethod
    def normalize_auth_jwt_claim_config(cls, value: str) -> str:
        return value.strip()

    @field_validator("auth_jwks_url", "auth_oidc_jwks_url")
    @classmethod
    def validate_jwks_url(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            return normalized
        try:
            parsed = AnyUrl(normalized)
        except PydanticCoreValidationError as exc:
            raise ValueError("AUTH_JWKS_URL / AUTH_OIDC_JWKS_URL must be a valid absolute URL") from exc
        if parsed.scheme not in {"http", "https"}:
            raise ValueError("AUTH_JWKS_URL / AUTH_OIDC_JWKS_URL must use http or https")
        return normalized

    @field_validator(
        "gemma4_model_id",
        "deepseek_model_id",
        "ollama_qwen25_model_id",
        "ollama_gemma3_model_id",
        "ollama_llama32_model_id",
    )
    @classmethod
    def normalize_model_id(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("model id must not be empty")
        if MODEL_ID_PATTERN.fullmatch(normalized) is None:
            raise ValueError("model id contains unsupported characters")
        return normalized

    @field_validator("local_llm_keep_alive")
    @classmethod
    def validate_local_llm_keep_alive(cls, value: str) -> str:
        normalized = value.strip()
        if KEEP_ALIVE_PATTERN.fullmatch(normalized) is None:
            raise ValueError("LOCAL_LLM_KEEP_ALIVE must be -1, 0, or a duration like 30m")
        return normalized

    @field_validator("gemma4_parser_url", "local_llm_parser_url", "ollama_chat_url")
    @classmethod
    def validate_runtime_url(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            return normalized
        try:
            parsed = AnyUrl(normalized)
        except PydanticCoreValidationError as exc:
            raise ValueError("runtime URL must be a valid absolute URL") from exc
        if parsed.scheme not in {"http", "https"}:
            raise ValueError("runtime URL must use http or https")
        return normalized

    @model_validator(mode="after")
    def validate_production_defaults(self) -> "Settings":
        if self.app_env == "production":
            if self.allow_dev_auth:
                raise ValueError("ALLOW_DEV_AUTH must be false in production")
            if self.auth_jwt_secret and len(self.auth_jwt_secret) < 32:
                raise ValueError("AUTH_JWT_SECRET must be at least 32 characters in production")
            if self.auth_jwt_secret and not self.auth_jwt_issuer:
                raise ValueError("AUTH_JWT_ISSUER must be set when AUTH_JWT_SECRET is configured in production")
            if self.auth_jwt_secret and not self.auth_jwt_audience:
                raise ValueError("AUTH_JWT_AUDIENCE must be set when AUTH_JWT_SECRET is configured in production")
            if self.auth_jwt_secret and not self.auth_jwt_require_jti:
                raise ValueError("AUTH_JWT_REQUIRE_JTI must be true when AUTH_JWT_SECRET is configured in production")
            if self.auth_jwks_url:
                if not self.auth_jwks_url.startswith("https://"):
                    raise ValueError("AUTH_JWKS_URL must use https in production")
                if not self.auth_jwt_issuer:
                    raise ValueError("AUTH_JWT_ISSUER must be set when AUTH_JWKS_URL is configured in production")
                if not self.auth_jwt_audience:
                    raise ValueError("AUTH_JWT_AUDIENCE must be set when AUTH_JWKS_URL is configured in production")
                if not self.auth_jwt_require_jti:
                    raise ValueError("AUTH_JWT_REQUIRE_JTI must be true when AUTH_JWKS_URL is configured in production")
            if self.auth_oidc_jwks_url:
                if not self.auth_oidc_jwks_url.startswith("https://"):
                    raise ValueError("AUTH_OIDC_JWKS_URL must use https in production")
                if not self.auth_oidc_issuer:
                    raise ValueError("AUTH_OIDC_ISSUER must be set when AUTH_OIDC_JWKS_URL is configured in production")
                if not self.auth_oidc_audience:
                    raise ValueError("AUTH_OIDC_AUDIENCE must be set when AUTH_OIDC_JWKS_URL is configured in production")
                if not self.auth_jwt_secret:
                    raise ValueError("AUTH_JWT_SECRET must be set when AUTH_OIDC_JWKS_URL is configured in production")
            if "*" in self.cors_origins:
                raise ValueError("Wildcard CORS origin is not allowed in production")
            if self.enable_debug_tools:
                raise ValueError("ENABLE_DEBUG_TOOLS must be false in production")
        return self

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.backend_cors_origins.split(",") if origin.strip()]

    @property
    def dev_auth_enabled(self) -> bool:
        if self.allow_dev_auth is not None:
            return self.allow_dev_auth
        return self.app_env in {"local", "test", "development"}

    @property
    def gemma4_parser_endpoint(self) -> AnyUrl | None:
        return AnyUrl(self.gemma4_parser_url) if self.gemma4_parser_url else None

    @property
    def local_llm_parser_endpoint(self) -> AnyUrl:
        return AnyUrl(self.local_llm_parser_url)

    @property
    def ollama_chat_endpoint(self) -> AnyUrl:
        return AnyUrl(self.ollama_chat_url)


@lru_cache
def get_settings() -> Settings:
    return Settings()
