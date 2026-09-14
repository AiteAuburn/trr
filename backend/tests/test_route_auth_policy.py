from fastapi.routing import APIRoute

from app.api import (
    achievements,
    admin,
    ai,
    auth,
    community,
    daily_records,
    dev,
    profiles,
    records,
    reports,
    store,
    subscriptions,
    year_reviews,
)
from app.api.deps import get_current_account
from app.api.admin import get_current_admin
from app.main import app
from app.services.route_auth_policy import PUBLIC_ROUTE_REASONS


ROUTERS = (
    achievements.router,
    admin.router,
    ai.router,
    auth.router,
    community.router,
    daily_records.router,
    dev.router,
    profiles.router,
    records.router,
    reports.router,
    store.router,
    subscriptions.router,
    year_reviews.router,
)


def route_key(route: APIRoute) -> tuple[str, str]:
    methods = route.methods or set()
    assert len(methods) == 1, f"route must declare exactly one method: {route.path}"
    return next(iter(methods)), route.path


def has_required_auth_dependency(route: APIRoute) -> bool:
    protected_dependencies = {get_current_account, get_current_admin}
    return any(
        dependency.call in protected_dependencies for dependency in route.dependant.dependencies
    )


def test_every_api_route_is_authenticated_or_explicitly_reviewed_public() -> None:
    routes = [
        route
        for router in ROUTERS
        for route in router.routes
        if isinstance(route, APIRoute)
    ]
    routes.extend(route for route in app.routes if isinstance(route, APIRoute))
    actual_public: set[tuple[str, str]] = set()
    unprotected: list[tuple[str, str]] = []

    for route in routes:
        key = route_key(route)
        if key in PUBLIC_ROUTE_REASONS:
            actual_public.add(key)
        elif not has_required_auth_dependency(route):
            unprotected.append(key)

    assert unprotected == []
    assert actual_public == set(PUBLIC_ROUTE_REASONS)
    assert all(reason.strip() for reason in PUBLIC_ROUTE_REASONS.values())
