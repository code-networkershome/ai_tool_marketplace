"""
Analytics models for tracking and ML data collection.
"""
from sqlalchemy import Column, String, Integer, Float, Text, JSON, DateTime, Index
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime

from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class SearchLog(Base, UUIDMixin, TimestampMixin):
    """Search query logging for analytics and ML training."""

    __tablename__ = "search_logs"

    query = Column(String(500), nullable=False, index=True)
    query_normalized = Column(String(500))  # Lowercase, cleaned

    # Results
    results_count = Column(Integer)
    result_tool_ids = Column(JSON)  # Array of tool IDs returned
    clicked_tool_id = Column(UUID(as_uuid=True))
    clicked_position = Column(Integer)

    # Search type
    search_type = Column(String(20))  # keyword, semantic, hybrid

    # Filters applied
    filters = Column(JSON)  # category, pricing, tags, etc.

    # User context
    user_id = Column(UUID(as_uuid=True), index=True)
    session_id = Column(String(64), index=True)
    user_agent = Column(String(512))
    ip_hash = Column(String(64))

    # Timing
    response_time_ms = Column(Integer)

    __table_args__ = (
        Index("ix_search_logs_query_date", "query_normalized", "created_at"),
    )


class PageView(Base, UUIDMixin, TimestampMixin):
    """Page view tracking."""

    __tablename__ = "page_views"

    page_type = Column(String(50), nullable=False)  # home, category, tool, search
    page_id = Column(String(100))  # category slug or tool slug

    # User
    user_id = Column(UUID(as_uuid=True), index=True)
    session_id = Column(String(64), index=True)

    # Referrer
    referrer = Column(String(512))
    utm_source = Column(String(100))
    utm_medium = Column(String(100))
    utm_campaign = Column(String(100))

    # Device
    device_type = Column(String(20))  # desktop, mobile, tablet
    browser = Column(String(50))
    os = Column(String(50))

    # Geo
    country_code = Column(String(2))
    region = Column(String(100))

    # Timing
    time_on_page_seconds = Column(Integer)

    __table_args__ = (
        Index("ix_page_views_type_date", "page_type", "created_at"),
    )


class DailyStats(Base, UUIDMixin):
    """Aggregated daily statistics."""

    __tablename__ = "daily_stats"

    date = Column(DateTime, nullable=False, index=True)
    stat_type = Column(String(50), nullable=False)  # tool, category, platform
    entity_id = Column(UUID(as_uuid=True), index=True)

    # Metrics
    views = Column(Integer, default=0)
    unique_views = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    saves = Column(Integer, default=0)
    reviews = Column(Integer, default=0)
    searches = Column(Integer, default=0)

    # Revenue (if applicable)
    revenue = Column(Float, default=0.0)
    ad_impressions = Column(Integer, default=0)
    ad_clicks = Column(Integer, default=0)

    __table_args__ = (
        Index("ix_daily_stats_date_type", "date", "stat_type"),
    )


class RankingConfig(Base, UUIDMixin, TimestampMixin):
    """Dynamic ranking configuration."""

    __tablename__ = "ranking_configs"

    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)

    # Weights
    weight_sponsored = Column(Float, default=100.0)
    weight_featured = Column(Float, default=50.0)
    weight_engagement = Column(Float, default=30.0)
    weight_reviews = Column(Float, default=20.0)
    weight_freshness = Column(Float, default=10.0)
    weight_internal = Column(Float, default=80.0)

    # Decay factors
    freshness_decay_days = Column(Integer, default=30)
    engagement_decay_days = Column(Integer, default=7)

    # Thresholds
    min_reviews_for_score = Column(Integer, default=5)
    trending_threshold = Column(Integer, default=100)

    is_active = Column(String(5), default="true")
