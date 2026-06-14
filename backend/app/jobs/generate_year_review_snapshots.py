import argparse
from datetime import UTC, datetime

from app.db.session import SessionLocal
from app.services.year_review_snapshots import (
    YEAR_REVIEW_GENERATION_BATCH_SIZE,
    generate_missing_year_review_snapshots,
)


def default_target_year(now: datetime | None = None) -> int:
    current = now or datetime.now(UTC)
    return current.year - 1


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate missing annual year-review snapshots for scheduler jobs."
    )
    parser.add_argument(
        "--year",
        type=int,
        default=default_target_year(),
        help="Target review year. Defaults to the previous calendar year.",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=YEAR_REVIEW_GENERATION_BATCH_SIZE,
        help=f"Profiles to process per transaction, max {YEAR_REVIEW_GENERATION_BATCH_SIZE}.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    total_created = 0
    total_scanned = 0
    batches = 0
    with SessionLocal() as db:
        while True:
            created_count, scanned_count = generate_missing_year_review_snapshots(
                year=args.year,
                db=db,
                batch_size=args.batch_size,
            )
            db.commit()
            batches += 1
            total_created += created_count
            total_scanned += scanned_count
            if scanned_count == 0:
                break

    print(
        "year_review_snapshots_generated "
        f"year={args.year} created={total_created} scanned={total_scanned} batches={batches}"
    )


if __name__ == "__main__":
    main()
