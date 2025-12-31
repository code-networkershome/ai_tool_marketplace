"""
Admin API endpoints for dashboard and management.
"""
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_admin
from app.models.tool import Tool, ToolStatus
from app.models.user import User, UserRole
from app.models.category import Category
from app.models.engagement import Review, Engagement
from app.models.analytics import SearchLog, PageView, DailyStats, RankingConfig
from app.schemas.analytics import (
    PlatformStats, ToolStats, CategoryStats,
    RankingConfigUpdate, RankingConfigResponse,
    TopSearchQuery, DateRangeQuery
)
from app.schemas.tool import ToolResponse, ToolListResponse
from app.schemas.user import UserResponse
from app.schemas.common import PaginatedResponse, BaseResponse
from app.services.ranking import ranking_service

router = APIRouter()


@router.get("/stats", response_model=PlatformStats)
async def get_platform_stats(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """
    Get overall platform statistics.
    """
    today = datetime.utcnow().date()
    month_start = today.replace(day=1)

    # Get counts
    total_tools = (await db.execute(select(func.count(Tool.id)))).scalar() or 0
    total_users = (await db.execute(select(func.count(User.id)))).scalar() or 0
    total_categories = (await db.execute(select(func.count(Category.id)))).scalar() or 0
    total_reviews = (await db.execute(select(func.count(Review.id)))).scalar() or 0

    tools_pending = (await db.execute(
        select(func.count(Tool.id)).where(Tool.status == ToolStatus.PENDING)
    )).scalar() or 0

    tools_approved = (await db.execute(
        select(func.count(Tool.id)).where(Tool.status == ToolStatus.APPROVED)
    )).scalar() or 0

    # Today's engagement (simplified)
    total_views_today = (await db.execute(
        select(func.sum(Tool.view_count))
    )).scalar() or 0

    total_clicks_today = (await db.execute(
        select(func.sum(Tool.click_count))
    )).scalar() or 0

    total_saves_today = (await db.execute(
        select(func.sum(Tool.save_count))
    )).scalar() or 0

    # Search count today
    total_searches_today = (await db.execute(
        select(func.count(SearchLog.id))
    )).scalar() or 0

    return PlatformStats(
        total_tools=total_tools,
        total_users=total_users,
        total_categories=total_categories,
        total_reviews=total_reviews,
        tools_pending=tools_pending,
        tools_approved=tools_approved,
        total_views_today=total_views_today,
        total_clicks_today=total_clicks_today,
        total_saves_today=total_saves_today,
        total_searches_today=total_searches_today,
        revenue_today=0.0,  # Would integrate with payment system
        revenue_month=0.0
    )


@router.get("/tools/pending", response_model=PaginatedResponse[ToolListResponse])
async def get_pending_tools(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """
    Get tools pending moderation.
    """
    query = select(Tool).where(Tool.status == ToolStatus.PENDING)
    query = query.order_by(Tool.created_at.desc())

    # Count
    count_query = select(func.count(Tool.id)).where(Tool.status == ToolStatus.PENDING)
    total = (await db.execute(count_query)).scalar() or 0

    # Pagination
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    tools = result.scalars().all()

    return PaginatedResponse(
        items=[ToolListResponse.model_validate(t) for t in tools],
        total=total,
        page=page,
        limit=limit,
        pages=(total + limit - 1) // limit if total > 0 else 1,
        has_next=offset + len(tools) < total,
        has_prev=page > 1
    )


@router.get("/tools", response_model=PaginatedResponse[ToolListResponse])
async def list_admin_tools(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None, pattern="^(pending|approved|rejected|archived)$"),
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """
    List all tools for admin management (with optional filtering).
    """
    query = select(Tool)

    # Apply filters
    if status:
        query = query.where(Tool.status == status)
    
    if search:
        search_term = f"%{search}%"
        query = query.where(
            or_(
                Tool.name.ilike(search_term),
                Tool.slug.ilike(search_term),
                Tool.website_url.ilike(search_term)
            )
        )

    query = query.order_by(Tool.created_at.desc())

    # Count
    count_query = select(func.count(Tool.id))
    if status:
        count_query = count_query.where(Tool.status == status)
    if search:
        count_query = count_query.where(
            or_(
                Tool.name.ilike(search_term),
                Tool.slug.ilike(search_term),
                Tool.website_url.ilike(search_term)
            )
        )
            
    total = (await db.execute(count_query)).scalar() or 0

    # Pagination
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    tools = result.scalars().all()

    return PaginatedResponse(
        items=[ToolListResponse.model_validate(t) for t in tools],
        total=total,
        page=page,
        limit=limit,
        pages=(total + limit - 1) // limit if total > 0 else 1,
        has_next=offset + len(tools) < total,
        has_prev=page > 1
    )


@router.get("/tools/{tool_id}/stats", response_model=ToolStats)
async def get_tool_stats(
    tool_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """
    Get detailed statistics for a tool.
    """
    tool = await db.get(Tool, tool_id)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    # Calculate CTR
    ctr = (tool.click_count / tool.view_count * 100) if tool.view_count > 0 else 0

    return ToolStats(
        tool_id=tool.id,
        tool_name=tool.name,
        views_total=tool.view_count,
        views_today=0,  # Would come from daily stats
        views_week=0,
        clicks_total=tool.click_count,
        clicks_today=0,
        click_through_rate=round(ctr, 2),
        saves_total=tool.save_count,
        reviews_total=tool.review_count,
        average_rating=tool.average_rating,
        rank_position=0,  # Would calculate position
        trending_score=tool.rank_score
    )


@router.get("/users", response_model=PaginatedResponse[UserResponse])
async def list_users(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    role: Optional[UserRole] = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """
    List all users with optional role filter.
    """
    query = select(User)

    if role:
        query = query.where(User.role == role)

    query = query.order_by(User.created_at.desc())

    # Count
    count_query = select(func.count(User.id))
    if role:
        count_query = count_query.where(User.role == role)
    total = (await db.execute(count_query)).scalar() or 0

    # Pagination
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    users = result.scalars().all()

    return PaginatedResponse(
        items=[UserResponse.model_validate(u) for u in users],
        total=total,
        page=page,
        limit=limit,
        pages=(total + limit - 1) // limit if total > 0 else 1,
        has_next=offset + len(users) < total,
        has_prev=page > 1
    )


@router.patch("/users/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: UUID,
    role: UserRole,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """
    Update a user's role.
    """
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = role
    await db.commit()
    await db.refresh(user)

    return UserResponse.model_validate(user)


@router.get("/searches/top", response_model=List[TopSearchQuery])
async def get_top_searches(
    limit: int = Query(20, ge=1, le=100),
    days: int = Query(7, ge=1, le=90),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """
    Get top search queries.
    """
    cutoff = datetime.utcnow() - timedelta(days=days)

    # Aggregate searches
    query = select(
        SearchLog.query_normalized,
        func.count(SearchLog.id).label("count"),
        func.avg(SearchLog.results_count).label("avg_results")
    ).where(
        SearchLog.created_at >= cutoff
    ).group_by(
        SearchLog.query_normalized
    ).order_by(
        func.count(SearchLog.id).desc()
    ).limit(limit)

    result = await db.execute(query)
    rows = result.all()

    return [
        TopSearchQuery(
            query=row[0] or "unknown",
            count=row[1],
            avg_results=round(row[2] or 0, 1),
            click_through_rate=0.0  # Would calculate from clicks
        )
        for row in rows
    ]


@router.get("/ranking/config", response_model=RankingConfigResponse)
async def get_ranking_config(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """
    Get current ranking configuration.
    """
    result = await db.execute(
        select(RankingConfig).where(RankingConfig.is_active == "true")
    )
    config = result.scalar_one_or_none()

    if not config:
        # Create default config
        config = RankingConfig(
            name="default",
            description="Default ranking configuration",
            weight_sponsored=100.0,
            weight_featured=50.0,
            weight_engagement=30.0,
            weight_reviews=20.0,
            weight_freshness=10.0,
            weight_internal=80.0,
            freshness_decay_days=30,
            engagement_decay_days=7,
            min_reviews_for_score=5,
            trending_threshold=100,
            is_active="true"
        )
        db.add(config)
        await db.commit()
        await db.refresh(config)

    return RankingConfigResponse.model_validate(config)


@router.patch("/ranking/config", response_model=RankingConfigResponse)
async def update_ranking_config(
    data: RankingConfigUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """
    Update ranking configuration weights.
    """
    result = await db.execute(
        select(RankingConfig).where(RankingConfig.is_active == "true")
    )
    config = result.scalar_one_or_none()

    if not config:
        raise HTTPException(status_code=404, detail="Ranking config not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(config, field, value)

    await db.commit()
    await db.refresh(config)

    # Reload ranking service config
    await ranking_service.load_config(db)

    return RankingConfigResponse.model_validate(config)


@router.post("/ranking/recalculate", response_model=BaseResponse)
async def recalculate_rankings(
    tool_ids: Optional[List[UUID]] = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """
    Trigger ranking recalculation for all or specific tools.
    """
    await ranking_service.bulk_update_rankings(db, tool_ids)

    return BaseResponse(message="Rankings recalculated successfully")


@router.post("/tools/bulk-action", response_model=BaseResponse)
async def bulk_tool_action(
    tool_ids: List[UUID],
    action: str = Query(..., pattern="^(approve|reject|archive|feature|unfeature)$"),
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """
    Perform bulk actions on multiple tools.
    """
    result = await db.execute(
        select(Tool).where(Tool.id.in_(tool_ids))
    )
    tools = result.scalars().all()

    for tool in tools:
        if action == "approve":
            tool.status = ToolStatus.APPROVED
        elif action == "reject":
            tool.status = ToolStatus.REJECTED
        elif action == "archive":
            tool.status = ToolStatus.ARCHIVED
        elif action == "feature":
            tool.is_featured = True
        elif action == "unfeature":
            tool.is_featured = False

    await db.commit()

    return BaseResponse(message=f"Action '{action}' applied to {len(tools)} tools")

@router.post("/tools/{tool_id}/auto-categorize")
async def auto_categorize_tool(
    tool_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """
    Auto-categorize a tool using LLM.
    """
    from app.services.llm_extractor import llm_extractor
    from app.services.tool_service import tool_service
    
    tool = await db.get(Tool, tool_id)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")
    
    # Classify category
    category_name = await llm_extractor.classify_category(
        name=tool.name,
        description=tool.short_description,
        tags=tool.tags or []
    )
    
    # Get or create the category
    category = await tool_service._get_or_create_category(db, category_name)
    
    if category:
        tool.category_id = category.id
        await db.commit()
        await db.refresh(tool)
    
    return {
        "success": True,
        "category_name": category_name,
        "category_id": str(category.id) if category else None
    }
