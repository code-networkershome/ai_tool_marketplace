"""
Promotion and subscription schemas.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

from app.models.promotion import PromotionType, SubscriptionTier, PaymentStatus


class PromotionCreate(BaseModel):
    """Schema for creating a promotion."""
    tool_id: UUID
    promotion_type: PromotionType
    title: Optional[str] = None
    starts_at: datetime
    ends_at: datetime
    target_categories: Optional[List[UUID]] = None
    target_regions: Optional[List[str]] = None
    position: Optional[int] = None
    max_impressions: Optional[int] = None
    max_clicks: Optional[int] = None
    budget_amount: Optional[float] = None


class PromotionUpdate(BaseModel):
    """Schema for updating a promotion."""
    title: Optional[str] = None
    starts_at: Optional[datetime] = None
    ends_at: Optional[datetime] = None
    position: Optional[int] = None
    is_active: Optional[bool] = None


class PromotionResponse(BaseModel):
    """Schema for promotion response."""
    id: UUID
    tool_id: UUID
    promotion_type: PromotionType
    title: Optional[str]
    starts_at: datetime
    ends_at: datetime
    position: Optional[int]
    impressions: int
    clicks: int
    conversions: int
    budget_amount: Optional[float]
    spent_amount: float
    is_active: bool
    is_approved: bool
    payment_status: PaymentStatus
    created_at: datetime

    class Config:
        from_attributes = True


class SubscriptionCreate(BaseModel):
    """Schema for creating a subscription."""
    tier: SubscriptionTier
    payment_method_id: Optional[str] = None


class SubscriptionResponse(BaseModel):
    """Schema for subscription response."""
    id: UUID
    user_id: UUID
    tier: SubscriptionTier
    current_period_start: Optional[datetime]
    current_period_end: Optional[datetime]
    max_tools: int
    max_promotions: int
    api_rate_limit: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class AffiliateLinkCreate(BaseModel):
    """Schema for creating an affiliate link."""
    tool_id: UUID
    destination_url: str
    commission_type: str = Field(..., pattern="^(percentage|flat)$")
    commission_value: float = Field(..., gt=0)


class AffiliateLinkResponse(BaseModel):
    """Schema for affiliate link response."""
    id: UUID
    tool_id: UUID
    affiliate_code: str
    destination_url: str
    commission_type: str
    commission_value: float
    clicks: int
    conversions: int
    revenue: float
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
