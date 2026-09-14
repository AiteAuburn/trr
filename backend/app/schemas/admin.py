from datetime import date, datetime

from pydantic import BaseModel, Field, field_validator


class AdminLoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1, max_length=256)

    @field_validator("username")
    @classmethod
    def normalize_username(cls, value: str) -> str:
        return value.strip()


class AdminSessionResponse(BaseModel):
    authenticated: bool
    username: str = Field(min_length=1, max_length=64)


class ApiEndpointUsage(BaseModel):
    method: str
    route: str
    request_count: int = Field(ge=0)
    error_count: int = Field(ge=0)
    average_duration_ms: float = Field(ge=0)
    max_duration_ms: float = Field(ge=0)


class DailyApiUsage(BaseModel):
    date: date
    request_count: int = Field(ge=0)
    error_count: int = Field(ge=0)
    average_duration_ms: float = Field(ge=0)


class AiModelTokenUsage(BaseModel):
    provider: str
    model_id: str
    request_count: int = Field(ge=0)
    success_count: int = Field(ge=0)
    failure_count: int = Field(ge=0)
    usage_reported_count: int = Field(ge=0)
    input_tokens: int = Field(ge=0)
    output_tokens: int = Field(ge=0)
    total_tokens: int = Field(ge=0)


class AdminUsageOverview(BaseModel):
    generated_at: datetime
    days: int = Field(ge=1, le=90)
    total_requests: int = Field(ge=0)
    total_errors: int = Field(ge=0)
    total_tokens: int = Field(ge=0)
    endpoints: list[ApiEndpointUsage] = Field(max_length=50)
    daily: list[DailyApiUsage] = Field(max_length=90)
    models: list[AiModelTokenUsage] = Field(max_length=50)
