"""
Tool schemas for request/response validation.
"""
from pydantic import BaseModel, Field, HttpUrl, field_validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID

from app.models.tool import ToolStatus, PricingModel


class ToolBase(BaseModel):
    """Base tool schema."""
    name: str = Field(..., min_length=1, max_length=255)
    short_description: str = Field(..., min_length=10, max_length=500)
    long_description: Optional[str] = None
    tagline: Optional[str] = Field(None, max_length=255)
    website_url: str
    pricing_model: PricingModel = PricingModel.FREE
    pricing_details: Optional[str] = None
    starting_price: Optional[float] = None


class ToolCreate(ToolBase):
    """Schema for creating a tool."""
    category_id: UUID
    tags: List[str] = Field(default_factory=list)
    use_cases: List[str] = Field(default_factory=list)

    # Optional URLs
    logo_url: Optional[str] = None
    screenshot_url: Optional[str] = None
    demo_url: Optional[str] = None
    docs_url: Optional[str] = None
    github_url: Optional[str] = None
    twitter_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    discord_url: Optional[str] = None
    youtube_url: Optional[str] = None


class ToolUpdate(BaseModel):
    """Schema for updating a tool."""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    short_description: Optional[str] = Field(None, min_length=10, max_length=500)
    long_description: Optional[str] = None
    tagline: Optional[str] = Field(None, max_length=255)
    website_url: Optional[str] = None
    category_id: Optional[UUID] = None
    tags: Optional[List[str]] = None
    use_cases: Optional[List[str]] = None
    pricing_model: Optional[PricingModel] = None
    pricing_details: Optional[str] = None
    starting_price: Optional[float] = None

    # URLs
    logo_url: Optional[str] = None
    screenshot_url: Optional[str] = None
    demo_url: Optional[str] = None
    docs_url: Optional[str] = None
    github_url: Optional[str] = None
    twitter_url: Optional[str] = None


class ToolResponse(ToolBase):
    """Schema for tool response."""
    id: UUID
    slug: str
    category_id: Optional[UUID]
    tags: List[str]
    use_cases: List[str]

    # URLs
    logo_url: Optional[str]
    screenshot_url: Optional[str]
    demo_url: Optional[str]
    docs_url: Optional[str]
    github_url: Optional[str]
    twitter_url: Optional[str]

    # Status
    status: ToolStatus
    is_featured: bool
    is_sponsored: bool
    is_trending: bool
    is_editors_pick: bool
    is_verified: bool

    # Metrics
    view_count: int
    click_count: int
    save_count: int
    review_count: int
    average_rating: float
    rank_score: float

    # Meta
    created_at: datetime
    updated_at: datetime
    owner_id: Optional[UUID]

    class Config:
        from_attributes = True


class ToolListResponse(BaseModel):
    """Simplified tool for list views."""
    id: UUID
    name: str
    slug: str
    short_description: str
    logo_url: Optional[str]
    category_id: Optional[UUID]
    pricing_model: PricingModel
    starting_price: Optional[float]
    tags: List[str]
    is_featured: bool
    is_sponsored: bool
    is_trending: bool
    average_rating: float
    review_count: int
    rank_score: float

    class Config:
        from_attributes = True


class ToolURLSubmit(BaseModel):
    """Schema for URL-based tool submission."""
    url: str

    @field_validator("url")
    @classmethod
    def validate_url(cls, v):
        if not v.startswith(("http://", "https://")):
            raise ValueError("URL must start with http:// or https://")
        return v


class ToolExtractionResult(BaseModel):
    """Schema for LLM extraction result."""
    name: str
    short_description: str
    long_description: Optional[str]
    category: str
    tags: List[str]
    pricing_model: str
    pricing_details: Optional[str]
    logo_url: Optional[str]
    github_url: Optional[str]
    twitter_url: Optional[str]
    features: List[str]
    use_cases: List[str]
    raw_data: Dict[str, Any]


class ToolSearchQuery(BaseModel):
    """Schema for tool search."""
    query: str = Field(..., min_length=1, max_length=500)
    category_id: Optional[UUID] = None
    tags: Optional[List[str]] = None
    pricing_models: Optional[List[PricingModel]] = None
    min_rating: Optional[float] = Field(None, ge=0, le=5)
    search_type: str = Field(default="hybrid", pattern="^(keyword|semantic|hybrid)$")


class ToolRankingUpdate(BaseModel):
    """Schema for admin ranking update."""
    is_featured: Optional[bool] = None
    is_sponsored: Optional[bool] = None
    is_trending: Optional[bool] = None
    is_editors_pick: Optional[bool] = None
    is_internal: Optional[bool] = None
    sponsored_rank: Optional[int] = None
    featured_rank: Optional[int] = None


class ToolModerationAction(BaseModel):
    """Schema for moderation actions."""
    action: str = Field(..., pattern="^(approve|reject|archive)$")
    reason: Optional[str] = None
