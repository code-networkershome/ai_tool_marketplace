"""
Analytics schemas for admin dashboard.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date
from uuid import UUID


class SearchLogResponse(BaseModel):
    """Schema for search log entry."""
    id: UUID
    query: str
    results_count: int
    clicked_tool_id: Optional[UUID]
    clicked_position: Optional[int]
    search_type: str
    filters: Optional[Dict[str, Any]]
    response_time_ms: int
    created_at: datetime

    class Config:
        from_attributes = True


class TopSearchQuery(BaseModel):
    """Aggregated top search query."""
    query: str
    count: int
    avg_results: float
    click_through_rate: float


class DailyStatsResponse(BaseModel):
    """Schema for daily statistics."""
    date: datetime
    stat_type: str
    entity_id: Optional[UUID]
    views: int
    unique_views: int
    clicks: int
    saves: int
    reviews: int
    searches: int
    revenue: float

    class Config:
        from_attributes = True


class PlatformStats(BaseModel):
    """Overall platform statistics."""
    total_tools: int
    total_users: int
    total_categories: int
    total_reviews: int
    tools_pending: int
    tools_approved: int
    total_views_today: int
    total_clicks_today: int
    total_saves_today: int
    total_searches_today: int
    revenue_today: float
    revenue_month: float


class ToolStats(BaseModel):
    """Statistics for a specific tool."""
    tool_id: UUID
    tool_name: str
    views_total: int
    views_today: int
    views_week: int
    clicks_total: int
    clicks_today: int
    click_through_rate: float
    saves_total: int
    reviews_total: int
    average_rating: float
    rank_position: int
    trending_score: float


class CategoryStats(BaseModel):
    """Statistics for a category."""
    category_id: UUID
    category_name: str
    tool_count: int
    views_total: int
    views_week: int
    top_tools: List[Dict[str, Any]]
    avg_rating: float


class TrafficSource(BaseModel):
    """Traffic source breakdown."""
    source: str
    visits: int
    percentage: float


class RankingConfigUpdate(BaseModel):
    """Schema for updating ranking configuration."""
    name: Optional[str] = None
    weight_sponsored: Optional[float] = Field(None, ge=0)
    weight_featured: Optional[float] = Field(None, ge=0)
    weight_engagement: Optional[float] = Field(None, ge=0)
    weight_reviews: Optional[float] = Field(None, ge=0)
    weight_freshness: Optional[float] = Field(None, ge=0)
    weight_internal: Optional[float] = Field(None, ge=0)
    freshness_decay_days: Optional[int] = Field(None, ge=1)
    engagement_decay_days: Optional[int] = Field(None, ge=1)
    min_reviews_for_score: Optional[int] = Field(None, ge=0)
    trending_threshold: Optional[int] = Field(None, ge=0)


class RankingConfigResponse(BaseModel):
    """Schema for ranking config response."""
    id: UUID
    name: str
    description: Optional[str]
    weight_sponsored: float
    weight_featured: float
    weight_engagement: float
    weight_reviews: float
    weight_freshness: float
    weight_internal: float
    freshness_decay_days: int
    engagement_decay_days: int
    min_reviews_for_score: int
    trending_threshold: int
    is_active: str
    updated_at: datetime

    class Config:
        from_attributes = True


class DateRangeQuery(BaseModel):
    """Schema for date range queries."""
    start_date: date
    end_date: date
    granularity: str = Field(default="day", pattern="^(hour|day|week|month)$")
