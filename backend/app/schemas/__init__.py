"""
Pydantic schemas for request/response validation.
"""
from app.schemas.common import (
    BaseResponse,
    ErrorResponse,
    PaginationParams,
    PaginatedResponse,
)
from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
    UserLogin,
    TokenResponse,
)
from app.schemas.tool import (
    ToolCreate,
    ToolUpdate,
    ToolResponse,
    ToolListResponse,
    ToolURLSubmit,
    ToolExtractionResult,
    ToolSearchQuery,
    ToolRankingUpdate,
    ToolModerationAction,
)
from app.schemas.category import (
    CategoryCreate,
    CategoryUpdate,
    CategoryResponse,
    CategoryListResponse,
    CategoryWithChildren,
)
from app.schemas.engagement import (
    EngagementCreate,
    EngagementResponse,
    ReviewCreate,
    ReviewUpdate,
    ReviewResponse,
    SavedToolCreate,
    SavedToolResponse,
)
from app.schemas.promotion import (
    PromotionCreate,
    PromotionUpdate,
    PromotionResponse,
    SubscriptionCreate,
    SubscriptionResponse,
    AffiliateLinkCreate,
    AffiliateLinkResponse,
)
from app.schemas.analytics import (
    SearchLogResponse,
    TopSearchQuery,
    DailyStatsResponse,
    PlatformStats,
    ToolStats,
    CategoryStats,
    RankingConfigUpdate,
    RankingConfigResponse,
    DateRangeQuery,
)

__all__ = [
    # Common
    "BaseResponse",
    "ErrorResponse",
    "PaginationParams",
    "PaginatedResponse",
    # User
    "UserCreate",
    "UserUpdate",
    "UserResponse",
    "UserLogin",
    "TokenResponse",
    # Tool
    "ToolCreate",
    "ToolUpdate",
    "ToolResponse",
    "ToolListResponse",
    "ToolURLSubmit",
    "ToolExtractionResult",
    "ToolSearchQuery",
    "ToolRankingUpdate",
    "ToolModerationAction",
    # Category
    "CategoryCreate",
    "CategoryUpdate",
    "CategoryResponse",
    "CategoryListResponse",
    "CategoryWithChildren",
    # Engagement
    "EngagementCreate",
    "EngagementResponse",
    "ReviewCreate",
    "ReviewUpdate",
    "ReviewResponse",
    "SavedToolCreate",
    "SavedToolResponse",
    # Promotion
    "PromotionCreate",
    "PromotionUpdate",
    "PromotionResponse",
    "SubscriptionCreate",
    "SubscriptionResponse",
    "AffiliateLinkCreate",
    "AffiliateLinkResponse",
    # Analytics
    "SearchLogResponse",
    "TopSearchQuery",
    "DailyStatsResponse",
    "PlatformStats",
    "ToolStats",
    "CategoryStats",
    "RankingConfigUpdate",
    "RankingConfigResponse",
    "DateRangeQuery",
]
