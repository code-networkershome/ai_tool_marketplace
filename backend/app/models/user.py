"""
User model for authentication and authorization.
"""
from sqlalchemy import Column, String, Boolean, Enum as SQLEnum
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base
from app.models.base import UUIDMixin, TimestampMixin


class UserRole(str, enum.Enum):
    """User role enumeration."""
    USER = "user"
    CREATOR = "creator"
    ADMIN = "admin"
    SUPER_ADMIN = "super_admin"


class User(Base, UUIDMixin, TimestampMixin):
    """User model for marketplace users."""

    __tablename__ = "users"

    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255))
    company_name = Column(String(255))
    avatar_url = Column(String(512))

    role = Column(
        SQLEnum(UserRole),
        default=UserRole.USER,
        nullable=False
    )

    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)

    # API access
    api_key = Column(String(64), unique=True, index=True)
    api_requests_count = Column(String(20), default="0")

    # Relationships
    tools = relationship("Tool", back_populates="owner", lazy="dynamic", primaryjoin="User.id==Tool.owner_id")
    reviews = relationship("Review", back_populates="user", lazy="dynamic")
    saved_tools = relationship("SavedTool", back_populates="user", lazy="dynamic")
    subscriptions = relationship("Subscription", back_populates="user", lazy="dynamic")

    def __repr__(self):
        return f"<User {self.email}>"
