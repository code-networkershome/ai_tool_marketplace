"""
API v1 router - aggregates all endpoint routers.
"""
from fastapi import APIRouter

from app.api.v1.endpoints import tools, categories, auth, reviews, admin

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"]
)

api_router.include_router(
    tools.router,
    prefix="/tools",
    tags=["Tools"]
)

api_router.include_router(
    categories.router,
    prefix="/categories",
    tags=["Categories"]
)

api_router.include_router(
    reviews.router,
    prefix="/reviews",
    tags=["Reviews & Saved"]
)

api_router.include_router(
    admin.router,
    prefix="/admin",
    tags=["Admin"]
)
