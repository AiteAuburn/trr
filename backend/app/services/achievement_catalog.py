ACHIEVEMENT_LEVELS = (10, 50, 100, 150, 200, 250)
ACHIEVEMENT_LEVEL_STEP = 50
ACHIEVEMENT_MAX_LEVEL_COUNT = 16
ACHIEVEMENT_LEVEL_COLORS = ("#8DB7A5", "#3FA67F", "#2F8F72", "#D97706", "#B45309", "#2563EB")
ACHIEVEMENT_CATEGORY_DEFINITIONS = (
    {
        "id": "glucose",
        "label": "血糖記錄",
        "record_type": "glucose",
        "cumulative_icon": "血",
        "cumulative_color": "#2F8F72",
    },
    {
        "id": "meal",
        "label": "飲食記錄",
        "record_type": "meal",
        "cumulative_icon": "食",
        "cumulative_color": "#D97706",
    },
    {
        "id": "exercise",
        "label": "運動記錄",
        "record_type": "exercise",
        "cumulative_icon": "動",
        "cumulative_color": "#2563EB",
    },
)
ACHIEVEMENT_STREAK_BADGE_COLOR = "#8B5CF6"


def achievement_levels_for_progress(max_progress: int) -> tuple[int, ...]:
    bounded_progress = min(max(max_progress, 0), 1_000_000)
    levels = list(ACHIEVEMENT_LEVELS)
    if not levels:
        return ()

    next_level = levels[-1] + ACHIEVEMENT_LEVEL_STEP
    while (
        bounded_progress >= levels[-1]
        and len(levels) < ACHIEVEMENT_MAX_LEVEL_COUNT
        and next_level <= bounded_progress + ACHIEVEMENT_LEVEL_STEP
    ):
        levels.append(next_level)
        next_level += ACHIEVEMENT_LEVEL_STEP
    return tuple(levels)
