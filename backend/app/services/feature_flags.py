from __future__ import annotations

from typing import Literal, TypedDict

from app.core.config import Settings


FeatureFlagName = Literal[
    "food_photo_analysis",
    "health_integrations",
    "community_sharing",
    "store_redemptions",
]

PUBLIC_FEATURE_FLAGS: tuple[FeatureFlagName, ...] = (
    "food_photo_analysis",
    "health_integrations",
    "community_sharing",
    "store_redemptions",
)


class PublicFeatureFlagPayload(TypedDict):
    contract_version: str
    refresh_after_seconds: int
    flags: dict[FeatureFlagName, bool]


def public_feature_flag_payload(settings: Settings) -> PublicFeatureFlagPayload:
    return {
        "contract_version": "1",
        "refresh_after_seconds": 60,
        "flags": {
            "food_photo_analysis": settings.feature_food_photo_analysis,
            "health_integrations": settings.feature_health_integrations,
            "community_sharing": settings.feature_community_sharing,
            "store_redemptions": settings.feature_store_redemptions,
        },
    }
