"""
Tool model - the core entity of the marketplace.
"""
from sqlalchemy import (
    Column, String, Text, Boolean, Integer, Float,
    ForeignKey, Enum as SQLEnum, JSON, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY
import enum

from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class ToolStatus(str, enum.Enum):
    """Tool listing status."""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    ARCHIVED = "archived"


class PricingModel(str, enum.Enum):
    """Tool pricing model."""
    FREE = "free"
    FREEMIUM = "freemium"
    PAID = "paid"
    SUBSCRIPTION = "subscription"
    USAGE_BASED = "usage_based"
    CONTACT = "contact"
    OPEN_SOURCE = "open_source"


class Tool(Base, UUIDMixin, TimestampMixin):
    """AI Tool listing model."""

    __tablename__ = "tools"

    # Basic Info
    name = Column(String(255), nullable=False, index=True)
    slug = Column(String(255), unique=True, nullable=False, index=True)
    short_description = Column(String(500), nullable=False)
    long_description = Column(Text)
    tagline = Column(String(255))

    # URLs
    website_url = Column(String(512), nullable=False)
    logo_url = Column(String(512))
    screenshot_url = Column(String(512))
    demo_url = Column(String(512))
    docs_url = Column(String(512))

    # Social & Repository
    github_url = Column(String(512))
    twitter_url = Column(String(512))
    linkedin_url = Column(String(512))
    discord_url = Column(String(512))
    youtube_url = Column(String(512))

    # Classification
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), index=True)
    tags = Column(ARRAY(String), default=[])
    use_cases = Column(ARRAY(String), default=[])

    # Pricing
    pricing_model = Column(SQLEnum(PricingModel), default=PricingModel.FREE)
    pricing_details = Column(Text)
    starting_price = Column(Float)
    currency = Column(String(3), default="USD")

    # Status & Moderation
    status = Column(SQLEnum(ToolStatus), default=ToolStatus.PENDING, index=True)
    rejection_reason = Column(Text)
    moderated_at = Column(String(50))
    moderated_by = Column(UUID(as_uuid=True), ForeignKey("users.id"))

    # Ranking Flags
    is_featured = Column(Boolean, default=False, index=True)
    is_sponsored = Column(Boolean, default=False, index=True)
    is_trending = Column(Boolean, default=False, index=True)
    is_editors_pick = Column(Boolean, default=False)
    is_internal = Column(Boolean, default=False, index=True)  # Platform-owned tools
    is_verified = Column(Boolean, default=False)

    # Engagement Metrics (denormalized for performance)
    view_count = Column(Integer, default=0)
    click_count = Column(Integer, default=0)
    save_count = Column(Integer, default=0)
    review_count = Column(Integer, default=0)
    average_rating = Column(Float, default=0.0)

    # Ranking
    rank_score = Column(Float, default=0.0, index=True)
    sponsored_rank = Column(Integer)  # Manual sponsored position
    featured_rank = Column(Integer)   # Manual featured position

    # SEO & Meta
    meta_title = Column(String(255))
    meta_description = Column(String(500))
    meta_keywords = Column(ARRAY(String), default=[])

    # Extraction Metadata
    extracted_data = Column(JSON)  # Raw LLM extraction output
    last_scraped_at = Column(String(50))
    scrape_version = Column(Integer, default=1)

    # Owner
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)

    # Vector embedding ID (stored in Qdrant)
    embedding_id = Column(String(64))

    # Relationships
    owner = relationship("User", back_populates="tools", foreign_keys=[owner_id])
    category = relationship("Category", back_populates="tools")
    reviews = relationship("Review", back_populates="tool", lazy="dynamic")
    saved_by = relationship("SavedTool", back_populates="tool", lazy="dynamic")
    engagements = relationship("Engagement", back_populates="tool", lazy="dynamic")
    promotions = relationship("Promotion", back_populates="tool", lazy="dynamic")

    # Indexes for ranking queries
    __table_args__ = (
        Index("ix_tools_ranking", "status", "rank_score", "is_featured", "is_sponsored"),
        Index("ix_tools_category_rank", "category_id", "status", "rank_score"),
    )

    def __repr__(self):
        return f"<Tool {self.name}>"
