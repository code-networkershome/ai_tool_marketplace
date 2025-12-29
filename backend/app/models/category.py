"""
Category model for tool classification.
"""
from sqlalchemy import Column, String, Text, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class Category(Base, UUIDMixin, TimestampMixin):
    """Tool category model."""

    __tablename__ = "categories"

    name = Column(String(100), unique=True, nullable=False, index=True)
    slug = Column(String(100), unique=True, nullable=False, index=True)
    description = Column(Text)
    icon = Column(String(50))  # Icon name or emoji
    color = Column(String(7))  # Hex color code

    # Hierarchy
    parent_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"))
    sort_order = Column(Integer, default=0)

    # Visibility
    is_active = Column(Boolean, default=True)
    is_featured = Column(Boolean, default=False)

    # Metrics
    tool_count = Column(Integer, default=0)

    # SEO
    meta_title = Column(String(255))
    meta_description = Column(String(500))

    # Relationships
    tools = relationship("Tool", back_populates="category", lazy="dynamic")
    children = relationship("Category", backref="parent", remote_side="Category.id")

    def __repr__(self):
        return f"<Category {self.name}>"
