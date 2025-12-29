"""
Engagement and review schemas.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

from app.models.engagement import EngagementType


class EngagementCreate(BaseModel):
    """Schema for creating an engagement."""
    tool_id: UUID
    engagement_type: EngagementType
    source: Optional[str] = None
    search_query: Optional[str] = None
    referrer: Optional[str] = None


class EngagementResponse(BaseModel):
    """Schema for engagement response."""
    id: UUID
    tool_id: UUID
    engagement_type: EngagementType
    created_at: datetime

    class Config:
        from_attributes = True


class ReviewCreate(BaseModel):
    """Schema for creating a review."""
    tool_id: UUID
    rating: int = Field(..., ge=1, le=5)
    title: Optional[str] = Field(None, max_length=255)
    content: Optional[str] = None
    ease_of_use: Optional[int] = Field(None, ge=1, le=5)
    value_for_money: Optional[int] = Field(None, ge=1, le=5)
    features: Optional[int] = Field(None, ge=1, le=5)
    support: Optional[int] = Field(None, ge=1, le=5)


class ReviewUpdate(BaseModel):
    """Schema for updating a review."""
    rating: Optional[int] = Field(None, ge=1, le=5)
    title: Optional[str] = Field(None, max_length=255)
    content: Optional[str] = None
    ease_of_use: Optional[int] = Field(None, ge=1, le=5)
    value_for_money: Optional[int] = Field(None, ge=1, le=5)
    features: Optional[int] = Field(None, ge=1, le=5)
    support: Optional[int] = Field(None, ge=1, le=5)


class ReviewResponse(BaseModel):
    """Schema for review response."""
    id: UUID
    tool_id: UUID
    user_id: UUID
    rating: int
    title: Optional[str]
    content: Optional[str]
    ease_of_use: Optional[int]
    value_for_money: Optional[int]
    features: Optional[int]
    support: Optional[int]
    helpful_count: int
    not_helpful_count: int
    is_verified_purchase: str
    created_at: datetime
    updated_at: datetime

    # Populated from user
    user_name: Optional[str] = None
    user_avatar: Optional[str] = None

    class Config:
        from_attributes = True


class SavedToolCreate(BaseModel):
    """Schema for saving a tool."""
    tool_id: UUID
    collection_name: str = "default"
    notes: Optional[str] = None


class SavedToolResponse(BaseModel):
    """Schema for saved tool response."""
    id: UUID
    tool_id: UUID
    collection_name: str
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ReviewHelpful(BaseModel):
    """Schema for marking review as helpful."""
    helpful: bool
