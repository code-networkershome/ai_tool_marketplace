"""
Review API endpoints.
"""
from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.models.tool import Tool
from app.models.engagement import Review, SavedTool
from app.schemas.engagement import (
    ReviewCreate, ReviewUpdate, ReviewResponse,
    SavedToolCreate, SavedToolResponse, ReviewHelpful
)
from app.schemas.common import PaginatedResponse, BaseResponse

router = APIRouter()


@router.post("", response_model=ReviewResponse)
async def create_review(
    data: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Create a review for a tool.
    """
    # Check if tool exists
    tool = await db.get(Tool, data.tool_id)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    # Check if user already reviewed
    existing = await db.execute(
        select(Review).where(
            Review.tool_id == data.tool_id,
            Review.user_id == UUID(current_user["user_id"])
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="You have already reviewed this tool")

    # Create review
    review = Review(
        tool_id=data.tool_id,
        user_id=UUID(current_user["user_id"]),
        rating=data.rating,
        title=data.title,
        content=data.content,
        ease_of_use=data.ease_of_use,
        value_for_money=data.value_for_money,
        features=data.features,
        support=data.support
    )

    db.add(review)

    # Update tool rating
    tool.review_count += 1
    # Recalculate average
    all_ratings = await db.execute(
        select(func.avg(Review.rating)).where(Review.tool_id == data.tool_id)
    )
    tool.average_rating = all_ratings.scalar() or data.rating

    await db.commit()
    await db.refresh(review)

    return ReviewResponse.model_validate(review)


@router.get("/tool/{tool_id}", response_model=PaginatedResponse[ReviewResponse])
async def get_tool_reviews(
    tool_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sort: str = Query("newest", pattern="^(newest|highest|lowest|helpful)$"),
    db: AsyncSession = Depends(get_db),
):
    """
    Get reviews for a tool.
    """
    query = select(Review).where(Review.tool_id == tool_id)

    if sort == "newest":
        query = query.order_by(Review.created_at.desc())
    elif sort == "highest":
        query = query.order_by(Review.rating.desc())
    elif sort == "lowest":
        query = query.order_by(Review.rating.asc())
    elif sort == "helpful":
        query = query.order_by(Review.helpful_count.desc())

    # Get total count
    count_query = select(func.count(Review.id)).where(Review.tool_id == tool_id)
    total = (await db.execute(count_query)).scalar() or 0

    # Pagination
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    reviews = result.scalars().all()

    return PaginatedResponse(
        items=[ReviewResponse.model_validate(r) for r in reviews],
        total=total,
        page=page,
        limit=limit,
        pages=(total + limit - 1) // limit if total > 0 else 1,
        has_next=offset + len(reviews) < total,
        has_prev=page > 1
    )


@router.patch("/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_id: UUID,
    data: ReviewUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Update a review (owner only).
    """
    review = await db.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if str(review.user_id) != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(review, field, value)

    # Update tool average if rating changed
    if "rating" in update_data:
        tool = await db.get(Tool, review.tool_id)
        if tool:
            all_ratings = await db.execute(
                select(func.avg(Review.rating)).where(Review.tool_id == review.tool_id)
            )
            tool.average_rating = all_ratings.scalar() or review.rating

    await db.commit()
    await db.refresh(review)

    return ReviewResponse.model_validate(review)


@router.delete("/{review_id}", response_model=BaseResponse)
async def delete_review(
    review_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Delete a review (owner or admin only).
    """
    review = await db.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if str(review.user_id) != current_user["user_id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    tool = await db.get(Tool, review.tool_id)

    await db.delete(review)

    # Update tool stats
    if tool:
        tool.review_count = max(0, tool.review_count - 1)
        if tool.review_count > 0:
            all_ratings = await db.execute(
                select(func.avg(Review.rating)).where(Review.tool_id == review.tool_id)
            )
            tool.average_rating = all_ratings.scalar() or 0
        else:
            tool.average_rating = 0

    await db.commit()

    return BaseResponse(message="Review deleted successfully")


@router.post("/{review_id}/helpful", response_model=BaseResponse)
async def mark_review_helpful(
    review_id: UUID,
    data: ReviewHelpful,
    db: AsyncSession = Depends(get_db),
):
    """
    Mark a review as helpful or not helpful.
    """
    review = await db.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    if data.helpful:
        review.helpful_count += 1
    else:
        review.not_helpful_count += 1

    await db.commit()

    return BaseResponse(message="Feedback recorded")


# Saved tools endpoints
@router.post("/saved", response_model=SavedToolResponse)
async def save_tool(
    data: SavedToolCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Save/bookmark a tool.
    """
    user_id = UUID(current_user["user_id"])

    # Check if already saved
    existing = await db.execute(
        select(SavedTool).where(
            SavedTool.tool_id == data.tool_id,
            SavedTool.user_id == user_id
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Tool already saved")

    # Check if tool exists
    tool = await db.get(Tool, data.tool_id)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    saved = SavedTool(
        user_id=user_id,
        tool_id=data.tool_id,
        collection_name=data.collection_name,
        notes=data.notes
    )

    db.add(saved)

    # Update tool save count
    tool.save_count += 1

    await db.commit()
    await db.refresh(saved)

    return SavedToolResponse.model_validate(saved)


@router.get("/saved", response_model=List[SavedToolResponse])
async def get_saved_tools(
    collection: str = Query("default"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Get user's saved tools.
    """
    result = await db.execute(
        select(SavedTool).where(
            SavedTool.user_id == UUID(current_user["user_id"]),
            SavedTool.collection_name == collection
        ).order_by(SavedTool.created_at.desc())
    )
    saved = result.scalars().all()

    return [SavedToolResponse.model_validate(s) for s in saved]


@router.delete("/saved/{tool_id}", response_model=BaseResponse)
async def unsave_tool(
    tool_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Remove a saved tool.
    """
    result = await db.execute(
        select(SavedTool).where(
            SavedTool.tool_id == tool_id,
            SavedTool.user_id == UUID(current_user["user_id"])
        )
    )
    saved = result.scalar_one_or_none()

    if not saved:
        raise HTTPException(status_code=404, detail="Saved tool not found")

    # Update tool save count
    tool = await db.get(Tool, tool_id)
    if tool:
        tool.save_count = max(0, tool.save_count - 1)

    await db.delete(saved)
    await db.commit()

    return BaseResponse(message="Tool unsaved successfully")
