"""
Engagement models for tracking user interactions.
"""
from sqlalchemy import Column, String, Integer, Float, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import enum

from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class EngagementType(str, enum.Enum):
    """Type of user engagement."""
    VIEW = "view"
    CLICK = "click"
    SAVE = "save"
    UNSAVE = "unsave"
    SHARE = "share"
    COMPARE = "compare"


class Engagement(Base, UUIDMixin, TimestampMixin):
    """User engagement tracking."""

    __tablename__ = "engagements"

    tool_id = Column(UUID(as_uuid=True), ForeignKey("tools.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    session_id = Column(String(64), index=True)

    engagement_type = Column(SQLEnum(EngagementType), nullable=False, index=True)

    # Context
    referrer = Column(String(512))
    source = Column(String(100))  # search, category, featured, etc.
    search_query = Column(String(255))

    # Device info
    user_agent = Column(String(512))
    ip_hash = Column(String(64))  # Hashed for privacy

    # Relationships
    tool = relationship("Tool", back_populates="engagements")


class SavedTool(Base, UUIDMixin, TimestampMixin):
    """User's saved/bookmarked tools."""

    __tablename__ = "saved_tools"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    tool_id = Column(UUID(as_uuid=True), ForeignKey("tools.id"), nullable=False, index=True)

    # Collections
    collection_name = Column(String(100), default="default")
    notes = Column(Text)

    # Relationships
    user = relationship("User", back_populates="saved_tools")
    tool = relationship("Tool", back_populates="saved_by")


class Review(Base, UUIDMixin, TimestampMixin):
    """User reviews for tools."""

    __tablename__ = "reviews"

    tool_id = Column(UUID(as_uuid=True), ForeignKey("tools.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    rating = Column(Integer, nullable=False)  # 1-5
    title = Column(String(255))
    content = Column(Text)

    # Detailed ratings
    ease_of_use = Column(Integer)
    value_for_money = Column(Integer)
    features = Column(Integer)
    support = Column(Integer)

    # Moderation
    is_verified_purchase = Column(String(5), default="false")
    is_approved = Column(String(5), default="false")
    is_featured = Column(String(5), default="false")

    # Helpfulness
    helpful_count = Column(Integer, default=0)
    not_helpful_count = Column(Integer, default=0)

    # Relationships
    tool = relationship("Tool", back_populates="reviews")
    user = relationship("User", back_populates="reviews")
