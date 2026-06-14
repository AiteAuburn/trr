FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

COPY pyproject.toml constraints.txt ./
RUN pip install --no-cache-dir --timeout 120 --retries 5 --upgrade pip \
    && pip install --no-cache-dir --timeout 120 --retries 5 -c constraints.txt -e ".[dev]"

COPY app ./app
COPY alembic ./alembic
COPY alembic.ini ./
COPY tests ./tests

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
