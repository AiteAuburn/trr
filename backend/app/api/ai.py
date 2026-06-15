import json
from collections.abc import Iterator
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_account
from app.api.records import get_owned_profile
from app.core.config import get_settings
from app.db.session import SessionLocal, get_db
from app.models import Account
from app.schemas.ai import (
    AiModelOption,
    AiModelOptionsResponse,
    CommandProposalRequest,
    CommandProposalResponse,
    ParsePreviewRequest,
    ParsePreviewResponse,
)
from app.services.ai_pipeline import (
    GEMMA4_LLM_MODEL_ID,
    DEEPSEEK_LLM_MODEL_ID,
    LLM_MODELS,
    LocalParserError,
    LocalParserUnavailableError,
    OLLAMA_GEMMA3_LLM_MODEL_ID,
    OLLAMA_LLAMA32_LLM_MODEL_ID,
    OLLAMA_QWEN25_LLM_MODEL_ID,
    STT_MODELS,
    TranscriptTooComplexError,
    TranscriptTooDenseError,
    available_model_ids,
    build_command_proposal,
    build_parse_preview,
    enforce_transcript_complexity_budget,
    runtime_llm_models,
    stream_parse_progress,
    stream_local_parser_debug,
)
from app.services.entitlements import (
    VoiceQuotaDecision,
    evaluate_voice_quota,
    require_voice_quota,
    require_voice_quota_for_account_id,
)
from app.services.rate_limits import consume_fixed_window_rate_limit, normalize_retry_after_seconds
from app.services.record_time_validation import validate_record_occurred_at

router = APIRouter(prefix="/ai", tags=["ai"])

RUNTIME_DEPENDENT_LLM_MODEL_IDS = {
    GEMMA4_LLM_MODEL_ID,
    OLLAMA_QWEN25_LLM_MODEL_ID,
    OLLAMA_GEMMA3_LLM_MODEL_ID,
    OLLAMA_LLAMA32_LLM_MODEL_ID,
    DEEPSEEK_LLM_MODEL_ID,
}
STATIC_LLM_MODELS_BY_ID = {model.id: model for model in LLM_MODELS}
MAX_PROGRESS_STREAM_EVENT_CHARS = 256 * 1024


def parser_unavailable_detail(exc: LocalParserUnavailableError) -> dict[str, str]:
    raw_message = str(exc)
    hint = "parser_unavailable"
    if "GEMMA4_PARSER_URL" in raw_message:
        hint = "set_gemma4_parser_url"
    if "DEEPSEEK_PARSER_URL" in raw_message or "DEEPSEEK_API_KEY" in raw_message:
        hint = "set_deepseek_parser_url_and_key"
    return {
        "code": "local_parser_unavailable",
        "message": "Selected local parser is not available.",
        "hint": hint,
    }


def parser_failed_detail() -> dict[str, str]:
    return {
        "code": "local_parser_failed",
        "message": "Selected local parser could not produce a valid structured preview.",
    }


def unavailable_llm_detail(llm_model_id: str) -> dict[str, str]:
    hint = "select_available_llm_model"
    if llm_model_id == GEMMA4_LLM_MODEL_ID:
        hint = "set_gemma4_parser_url"
    if llm_model_id == DEEPSEEK_LLM_MODEL_ID:
        hint = "set_deepseek_parser_url_and_key"
    return {
        "code": "llm_model_unavailable",
        "message": "Selected LLM model is not available.",
        "hint": hint,
    }


def transcript_too_complex_detail(exc: TranscriptTooComplexError) -> dict[str, object]:
    return {
        "code": "transcript_too_complex",
        "message": "Transcript has too many atomic events for one parse request.",
        "max_segments": exc.max_segments,
        "segment_count": exc.segment_count,
    }


def transcript_too_dense_detail(exc: TranscriptTooDenseError) -> dict[str, object]:
    return {
        "code": "transcript_too_dense",
        "message": "Transcript has too many numeric values for one parse request.",
        "max_numeric_values": exc.max_numeric_values,
        "numeric_count": exc.numeric_count,
    }


def validate_ai_model_selection(
    *,
    stt_model_id: str,
    llm_model_id: str,
    llm_models: list[AiModelOption] | None = None,
) -> None:
    validate_stt_model_selection(stt_model_id)
    validate_llm_model_selection(llm_model_id, llm_models)


def validate_stt_model_selection(stt_model_id: str) -> None:
    if stt_model_id not in available_model_ids(STT_MODELS):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Selected STT model is not available",
        )


def validate_llm_model_selection(
    llm_model_id: str,
    llm_models: list[AiModelOption] | None = None,
) -> None:
    if llm_models is None:
        static_model = STATIC_LLM_MODELS_BY_ID.get(llm_model_id)
        if static_model is None or not static_model.available:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=unavailable_llm_detail(llm_model_id),
            )
        if llm_model_id not in RUNTIME_DEPENDENT_LLM_MODEL_IDS:
            return

    runtime_models = runtime_llm_models() if llm_models is None else llm_models
    if llm_model_id not in available_model_ids(runtime_models):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=unavailable_llm_detail(llm_model_id),
        )


def validate_parse_request_budget(transcript: str) -> None:
    try:
        enforce_transcript_complexity_budget(transcript)
    except TranscriptTooComplexError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=transcript_too_complex_detail(exc),
        ) from exc
    except TranscriptTooDenseError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=transcript_too_dense_detail(exc),
        ) from exc


def ai_rate_limit_exceeded_detail(retry_after_seconds: int) -> dict[str, object]:
    bounded_retry_after_seconds = normalize_retry_after_seconds(retry_after_seconds)
    return {
        "code": "rate_limit_exceeded",
        "message": "Too many AI parsing requests. Try again later.",
        "retry_after_seconds": bounded_retry_after_seconds,
    }


def voice_quota_exceeded_exception(decision: VoiceQuotaDecision) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail={
            "code": "voice_quota_exceeded",
            "limit_seconds": decision.limit_seconds,
            "used_seconds": decision.used_seconds,
            "requested_seconds": decision.requested_seconds,
            "remaining_seconds": decision.remaining_seconds,
            "plan_code": decision.plan_code,
        },
    )


def require_ai_parse_rate_limit(account: Account, db: Session) -> None:
    settings = get_settings()
    rate_limit = consume_fixed_window_rate_limit(
        scope="ai_parse",
        key=str(account.id),
        limit=settings.ai_parse_rate_limit_count,
        window_seconds=settings.ai_parse_rate_limit_window_seconds,
        db=db,
    )
    if not rate_limit.allowed:
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=ai_rate_limit_exceeded_detail(rate_limit.retry_after_seconds),
            headers={"Retry-After": str(normalize_retry_after_seconds(rate_limit.retry_after_seconds))},
        )


def stream_error_event(detail: dict[str, object]) -> str:
    return f"{json.dumps({'event': 'error', **detail}, ensure_ascii=False)}\n"


def voice_quota_stream_error(exc: HTTPException) -> str:
    detail: dict[str, object] = exc.detail if isinstance(exc.detail, dict) else {}
    return stream_error_event(
        {
            "code": detail.get("code", "voice_quota_unavailable"),
            "message": "語音額度不足，請改用文字輸入或稍後再試。",
            "hint": "use_text_input_or_wait",
            "limit_seconds": detail.get("limit_seconds", 0),
            "used_seconds": detail.get("used_seconds", 0),
            "requested_seconds": detail.get("requested_seconds", 0),
            "remaining_seconds": detail.get("remaining_seconds", 0),
            "plan_code": detail.get("plan_code", "unknown"),
        }
    )


def stream_progress_with_success_voice_quota(
    *,
    source: Iterator[str],
    account_id: UUID,
    voice_seconds: int,
) -> Iterator[str]:
    for line in source:
        if len(line) > MAX_PROGRESS_STREAM_EVENT_CHARS:
            yield stream_error_event(
                {
                    "code": "progress_event_too_large",
                    "message": "Parser progress event exceeded safe size.",
                    "hint": "retry_with_shorter_input",
                }
            )
            return

        try:
            event_payload = json.loads(line)
        except json.JSONDecodeError:
            yield line
            continue

        if event_payload.get("event") != "final":
            yield line
            continue

        with SessionLocal() as quota_db:
            try:
                require_voice_quota_for_account_id(account_id, voice_seconds, quota_db)
                quota_db.commit()
            except HTTPException as exc:
                quota_db.rollback()
                yield voice_quota_stream_error(exc)
                return
        yield line


@router.get("/models", response_model=AiModelOptionsResponse)
def list_ai_models() -> AiModelOptionsResponse:
    return AiModelOptionsResponse(stt_models=STT_MODELS, llm_models=runtime_llm_models())


@router.post("/parse-preview", response_model=ParsePreviewResponse)
def parse_preview(
    payload: ParsePreviewRequest,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> ParsePreviewResponse:
    validate_stt_model_selection(payload.stt_model_id)
    validate_record_occurred_at(payload.occurred_at)
    validate_parse_request_budget(payload.transcript)
    validate_llm_model_selection(payload.llm_model_id)
    get_owned_profile(payload.profile_id, account, db)
    require_ai_parse_rate_limit(account, db)
    db.commit()
    require_voice_quota(account, payload.voice_seconds, db)

    try:
        preview = build_parse_preview(
            profile_id=payload.profile_id,
            transcript=payload.transcript,
            stt_model_id=payload.stt_model_id,
            llm_model_id=payload.llm_model_id,
            occurred_at=payload.occurred_at,
        )
        db.commit()
        return preview
    except LocalParserUnavailableError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=parser_unavailable_detail(exc),
        ) from exc
    except LocalParserError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=parser_failed_detail(),
        ) from exc


@router.post("/parse-preview/debug-stream")
def parse_preview_debug_stream(
    payload: ParsePreviewRequest,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> StreamingResponse:
    if not get_settings().enable_debug_tools:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Debug tools are disabled",
        )
    validate_stt_model_selection(payload.stt_model_id)
    validate_record_occurred_at(payload.occurred_at)
    validate_parse_request_budget(payload.transcript)
    validate_llm_model_selection(payload.llm_model_id)
    get_owned_profile(payload.profile_id, account, db)
    require_ai_parse_rate_limit(account, db)
    require_voice_quota(account, payload.voice_seconds, db)
    db.commit()

    return StreamingResponse(
        stream_local_parser_debug(
            profile_id=payload.profile_id,
            transcript=payload.transcript.strip(),
            stt_model_id=payload.stt_model_id,
            llm_model_id=payload.llm_model_id,
            occurred_at=payload.occurred_at,
        ),
        media_type="text/plain; charset=utf-8",
    )


@router.post("/parse-preview/progress-stream")
def parse_preview_progress_stream(
    payload: ParsePreviewRequest,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> StreamingResponse:
    validate_stt_model_selection(payload.stt_model_id)
    validate_record_occurred_at(payload.occurred_at)
    validate_parse_request_budget(payload.transcript)
    validate_llm_model_selection(payload.llm_model_id)
    get_owned_profile(payload.profile_id, account, db)
    require_ai_parse_rate_limit(account, db)
    voice_quota = evaluate_voice_quota(account, payload.voice_seconds, db)
    if not voice_quota.allowed:
        db.commit()
        raise voice_quota_exceeded_exception(voice_quota)
    db.commit()

    return StreamingResponse(
        stream_progress_with_success_voice_quota(
            source=stream_parse_progress(
                profile_id=payload.profile_id,
                transcript=payload.transcript.strip(),
                stt_model_id=payload.stt_model_id,
                llm_model_id=payload.llm_model_id,
                occurred_at=payload.occurred_at,
            ),
            account_id=account.id,
            voice_seconds=payload.voice_seconds,
        ),
        media_type="application/x-ndjson; charset=utf-8",
    )


@router.post("/command-proposal", response_model=CommandProposalResponse)
def command_proposal(
    payload: CommandProposalRequest,
    account: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> CommandProposalResponse:
    validate_stt_model_selection(payload.stt_model_id)
    validate_record_occurred_at(payload.occurred_at)
    validate_parse_request_budget(payload.transcript)
    validate_llm_model_selection(payload.llm_model_id)
    get_owned_profile(payload.profile_id, account, db)
    require_ai_parse_rate_limit(account, db)
    db.commit()
    require_voice_quota(account, payload.voice_seconds, db)

    proposal = build_command_proposal(
        profile_id=payload.profile_id,
        transcript=payload.transcript,
        stt_model_id=payload.stt_model_id,
        llm_model_id=payload.llm_model_id,
        occurred_at=payload.occurred_at,
    )
    db.commit()
    return CommandProposalResponse(
        transcript="",
        stt_model_id=payload.stt_model_id,
        llm_model_id=payload.llm_model_id,
        proposal=proposal,
    )
