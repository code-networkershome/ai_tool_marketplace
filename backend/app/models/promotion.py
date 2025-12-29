"""
Promotion and subscription models for monetization.
"""
from sqlalchemy import (
    Column, String, Text, Integer, Float, Boolean,
    ForeignKey, Enum as SQLEnum, JSON, DateTime
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import enum
from datetime import datetime

from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class PromotionType(str, enum.Enum):
    """Type of promotion."""
    SPONSORED = "sponsored"
    FEATURED = "featured"
    LAUNCH = "launch"
    BANNER = "banner"
    CATEGORY_TOP = "category_top"


class SubscriptionTier(str, enum.Enum):
    """Subscription tier for tool creators."""
    FREE = "free"
    BASIC = "basic"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class PaymentStatus(str, enum.Enum):
    """Payment status."""
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class Promotion(Base, UUIDMixin, TimestampMixin):
    """Promotion campaigns for tools."""

    __tablename__ = "promotions"

    tool_id = Column(UUID(as_uuid=True), ForeignKey("tools.id"), nullable=False, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    promotion_type = Column(SQLEnum(PromotionType), nullable=False, index=True)
    title = Column(String(255))

    # Duration
    starts_at = Column(DateTime(timezone=True), nullable=False)
    ends_at = Column(DateTime(timezone=True), nullable=False)

    # Targeting
    target_categories = Column(JSON)  # List of category IDs
    target_regions = Column(JSON)     # List of region codes

    # Positioning
    position = Column(Integer)  # Manual position override
    max_impressions = Column(Integer)
    max_clicks = Column(Integer)

    # Budget
    budget_amount = Column(Float)
    spent_amount = Column(Float, default=0.0)
    cost_per_click = Column(Float)
    cost_per_impression = Column(Float)

    # Performance
    impressions = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    conversions = Column(Integer, default=0)

    # Status
    is_active = Column(Boolean, default=True)
    is_approved = Column(Boolean, default=False)
    payment_status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING)

    # Relationships
    tool = relationship("Tool", back_populates="promotions")


class Subscription(Base, UUIDMixin, TimestampMixin):
    """User subscription for premium features."""

    __tablename__ = "subscriptions"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)

    tier = Column(SQLEnum(SubscriptionTier), default=SubscriptionTier.FREE)

    # Billing
    stripe_customer_id = Column(String(100))
    stripe_subscription_id = Column(String(100))
    current_period_start = Column(DateTime(timezone=True))
    current_period_end = Column(DateTime(timezone=True))

    # Limits
    max_tools = Column(Integer, default=1)
    max_promotions = Column(Integer, default=0)
    api_rate_limit = Column(Integer, default=100)

    # Status
    is_active = Column(Boolean, default=True)
    canceled_at = Column(DateTime(timezone=True))

    # Relationships
    user = relationship("User", back_populates="subscriptions")


class AffiliateLink(Base, UUIDMixin, TimestampMixin):
    """Affiliate link tracking."""

    __tablename__ = "affiliate_links"

    tool_id = Column(UUID(as_uuid=True), ForeignKey("tools.id"), nullable=False, index=True)

    affiliate_code = Column(String(50), unique=True, nullable=False)
    destination_url = Column(String(512), nullable=False)

    # Commission
    commission_type = Column(String(20))  # percentage, flat
    commission_value = Column(Float)

    # Tracking
    clicks = Column(Integer, default=0)
    conversions = Column(Integer, default=0)
    revenue = Column(Float, default=0.0)

    is_active = Column(Boolean, default=True)
