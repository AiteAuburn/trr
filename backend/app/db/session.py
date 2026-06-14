from collections.abc import Generator
from time import perf_counter
from typing import Any

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Connection
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import get_settings
from app.core.metrics import http_metrics

settings = get_settings()

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def _db_operation(statement: str) -> str:
    first_token = statement.lstrip().split(maxsplit=1)[0].lower() if statement.strip() else "unknown"
    return first_token if first_token in {"select", "insert", "update", "delete"} else "other"


@event.listens_for(engine, "before_cursor_execute")
def _record_db_start(
    conn: Connection,
    cursor: Any,
    statement: str,
    parameters: Any,
    context: Any,
    executemany: bool,
) -> None:
    _ = (cursor, statement, parameters, context, executemany)
    conn.info.setdefault("query_start_time", []).append(perf_counter())


@event.listens_for(engine, "after_cursor_execute")
def _record_db_end(
    conn: Connection,
    cursor: Any,
    statement: str,
    parameters: Any,
    context: Any,
    executemany: bool,
) -> None:
    _ = (cursor, parameters, context, executemany)
    started_at = conn.info.get("query_start_time", []).pop(-1)
    http_metrics.record_db_operation(
        operation=_db_operation(statement),
        duration_seconds=perf_counter() - started_at,
    )


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
