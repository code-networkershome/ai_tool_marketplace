"""
Category schemas for request/response validation.
"""
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class CategoryBase(BaseModel):
    """Base category schema."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")


class CategoryCreate(CategoryBase):
    """Schema for creating a category."""
    slug: str = Field(..., min_length=1, max_length=100)
    parent_id: Optional[UUID] = None
    sort_order: int = 0


class CategoryUpdate(BaseModel):
    """Schema for updating a category."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = Field(None, pattern="^#[0-9A-Fa-f]{6}$")
    parent_id: Optional[UUID] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None
    is_featured: Optional[bool] = None


class CategoryResponse(CategoryBase):
    """Schema for category response."""
    id: UUID
    slug: str
    parent_id: Optional[UUID]
    sort_order: int
    is_active: bool
    is_featured: bool
    tool_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class CategoryWithChildren(CategoryResponse):
    """Category with nested children."""
    children: List["CategoryWithChildren"] = []


class CategoryListResponse(BaseModel):
    """Simplified category for list views."""
    id: UUID
    name: str
    slug: str
    icon: Optional[str]
    color: Optional[str]
    tool_count: int
    is_featured: bool

    class Config:
        from_attributes = True
