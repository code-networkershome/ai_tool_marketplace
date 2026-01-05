"""
Authentication API endpoints.
"""
from datetime import timedelta
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.config import settings
from app.core.security import (
    verify_password, get_password_hash,
    create_access_token, get_current_user
)
from app.models.user import User, UserRole
from app.schemas.user import (
    UserCreate, UserUpdate, UserResponse,
    UserLogin, TokenResponse
)
from app.schemas.common import BaseResponse

router = APIRouter()


@router.post("/register", response_model=TokenResponse)
async def register(
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new user.
    """
    # Check if email exists
    result = await db.execute(
        select(User).where(User.email == data.email)
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Create user
    user = User(
        email=data.email,
        hashed_password=get_password_hash(data.password),
        full_name=data.full_name,
        company_name=data.company_name,
        role=UserRole.USER,
        is_active=True
    )

    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Create token
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return TokenResponse(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user)
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    data: UserLogin,
    db: AsyncSession = Depends(get_db),
):
    """
    Login and get access token.
    """
    # Find user
    result = await db.execute(
        select(User).where(User.email == data.email)
    )
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is inactive"
        )

    # Create token
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return TokenResponse(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user)
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Get current user information.
    """
    user = await db.get(User, UUID(current_user["user_id"]))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return UserResponse.model_validate(user)


@router.patch("/me", response_model=UserResponse)
async def update_current_user(
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Update current user information.
    """
    user = await db.get(User, UUID(current_user["user_id"]))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)

    await db.commit()
    await db.refresh(user)

    return UserResponse.model_validate(user)


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Refresh access token.
    """
    user = await db.get(User, UUID(current_user["user_id"]))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Create new token
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role.value},
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    return TokenResponse(
        access_token=access_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user)
    )


@router.delete("/me", response_model=BaseResponse)
async def delete_current_account(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Delete current user's account (soft delete).
    Deactivates the account and marks it as deleted.
    """
    user = await db.get(User, UUID(current_user["user_id"]))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Soft delete the user
    user.soft_delete()
    await db.commit()

    return BaseResponse(
        success=True,
        message="Account deleted successfully"
    )


@router.delete("/users/{user_id}", response_model=BaseResponse)
async def delete_user_by_admin(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Delete a user account by admin (soft delete).
    Only admins can delete user accounts.
    """
    # Check if current user is admin
    current_user_data = await db.get(User, UUID(current_user["user_id"]))
    if not current_user_data or current_user_data.role not in [UserRole.ADMIN, UserRole.SUPER_ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can delete user accounts"
        )

    # Get user to delete
    user = await db.get(User, UUID(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Prevent deleting other admins unless super admin
    if user.role in [UserRole.ADMIN, UserRole.SUPER_ADMIN] and current_user_data.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot delete admin accounts"
        )

    # Soft delete the user
    user.soft_delete()
    await db.commit()

    return BaseResponse(
        success=True,
        message=f"User {user.email} deleted successfully"
    )
