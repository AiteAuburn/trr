from collections import defaultdict
import re
from threading import Lock


MetricKey = tuple[str, str, str]
ParserMetricKey = tuple[str, str, str]
DbMetricKey = tuple[str]
MAX_METRIC_LABEL_VALUE_LENGTH = 120
METRIC_LABEL_SAFE_PATTERN = re.compile(r"^[A-Za-z0-9_./:{}-]+$")
METRIC_LABEL_UNKNOWN = "unknown"


class HttpMetrics:
    def __init__(self) -> None:
        self._lock = Lock()
        self._request_counts: defaultdict[MetricKey, int] = defaultdict(int)
        self._duration_sums: defaultdict[MetricKey, float] = defaultdict(float)
        self._parser_results: defaultdict[ParserMetricKey, int] = defaultdict(int)
        self._db_operation_counts: defaultdict[DbMetricKey, int] = defaultdict(int)
        self._db_operation_duration_sums: defaultdict[DbMetricKey, float] = defaultdict(float)

    def record_request(
        self,
        *,
        method: str,
        route: str,
        status: int,
        duration_seconds: float,
    ) -> None:
        key = (
            normalize_metric_label_value(method.upper()),
            normalize_metric_label_value(route),
            normalize_metric_label_value(str(status)),
        )
        with self._lock:
            self._request_counts[key] += 1
            self._duration_sums[key] += duration_seconds

    def record_parser_result(
        self,
        *,
        model_id: str,
        outcome: str,
        reason: str,
    ) -> None:
        key = (
            normalize_metric_label_value(model_id),
            normalize_metric_label_value(outcome),
            normalize_metric_label_value(reason),
        )
        with self._lock:
            self._parser_results[key] += 1

    def record_db_operation(self, *, operation: str, duration_seconds: float) -> None:
        key = (normalize_metric_label_value(operation),)
        with self._lock:
            self._db_operation_counts[key] += 1
            self._db_operation_duration_sums[key] += duration_seconds

    def render_prometheus(self) -> str:
        lines = [
            "# HELP app_http_requests_total Total HTTP requests by method, route, and status.",
            "# TYPE app_http_requests_total counter",
        ]
        with self._lock:
            counts = dict(self._request_counts)
            duration_sums = dict(self._duration_sums)
            parser_results = dict(self._parser_results)
            db_operation_counts = dict(self._db_operation_counts)
            db_operation_duration_sums = dict(self._db_operation_duration_sums)
        for key, count in sorted(counts.items()):
            lines.append(f"app_http_requests_total{_labels(key)} {count}")

        lines.extend(
            [
                "# HELP app_http_request_duration_seconds_sum Total HTTP request duration seconds.",
                "# TYPE app_http_request_duration_seconds_sum counter",
            ]
        )
        for key, duration_sum in sorted(duration_sums.items()):
            lines.append(f"app_http_request_duration_seconds_sum{_labels(key)} {duration_sum:.6f}")

        lines.extend(
            [
                "# HELP app_parser_results_total Parser results by model, outcome, and reason.",
                "# TYPE app_parser_results_total counter",
            ]
        )
        for parser_key, count in sorted(parser_results.items()):
            lines.append(f"app_parser_results_total{_parser_labels(parser_key)} {count}")

        lines.extend(
            [
                "# HELP app_db_operations_total Database operations by operation type.",
                "# TYPE app_db_operations_total counter",
            ]
        )
        for db_key, count in sorted(db_operation_counts.items()):
            lines.append(f"app_db_operations_total{_db_labels(db_key)} {count}")

        lines.extend(
            [
                "# HELP app_db_operation_duration_seconds_sum Total DB operation duration seconds.",
                "# TYPE app_db_operation_duration_seconds_sum counter",
            ]
        )
        for db_key, duration_sum in sorted(db_operation_duration_sums.items()):
            lines.append(f"app_db_operation_duration_seconds_sum{_db_labels(db_key)} {duration_sum:.6f}")
        return "\n".join(lines) + "\n"

    def reset(self) -> None:
        with self._lock:
            self._request_counts.clear()
            self._duration_sums.clear()
            self._parser_results.clear()
            self._db_operation_counts.clear()
            self._db_operation_duration_sums.clear()


def _labels(key: MetricKey) -> str:
    method, route, status = key
    return (
        "{"
        f'method="{_escape_label_value(method)}",'
        f'route="{_escape_label_value(route)}",'
        f'status="{_escape_label_value(status)}"'
        "}"
    )


def _parser_labels(key: ParserMetricKey) -> str:
    model_id, outcome, reason = key
    return (
        "{"
        f'model_id="{_escape_label_value(model_id)}",'
        f'outcome="{_escape_label_value(outcome)}",'
        f'reason="{_escape_label_value(reason)}"'
        "}"
    )


def _db_labels(key: DbMetricKey) -> str:
    (operation,) = key
    return "{" f'operation="{_escape_label_value(operation)}"' "}"


def _escape_label_value(value: str) -> str:
    return value.replace("\\", "\\\\").replace("\n", "\\n").replace('"', '\\"')


def normalize_metric_label_value(value: object) -> str:
    if not isinstance(value, str):
        value = str(value)
    normalized = value.strip()
    if not normalized or METRIC_LABEL_SAFE_PATTERN.fullmatch(normalized) is None:
        return METRIC_LABEL_UNKNOWN
    normalized = normalized[:MAX_METRIC_LABEL_VALUE_LENGTH]
    return normalized or METRIC_LABEL_UNKNOWN


http_metrics = HttpMetrics()
