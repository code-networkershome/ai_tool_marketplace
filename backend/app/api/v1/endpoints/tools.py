"""
Tool API endpoints.
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, require_admin
from app.models.tool import Tool, ToolStatus
from app.models.engagement import EngagementType
from app.schemas.tool import (
    ToolCreate, ToolUpdate, ToolResponse, ToolListResponse,
    ToolURLSubmit, ToolExtractionResult, ToolSearchQuery,
    ToolRankingUpdate, ToolModerationAction
)
from app.schemas.common import PaginatedResponse, BaseResponse
from app.services.tool_service import tool_service
from app.services.ranking import ranking_service

router = APIRouter()


@router.post("/extract", response_model=ToolExtractionResult)
async def extract_from_url(
    data: ToolURLSubmit,
):
    """
    Extract tool information from a URL using LLM.
    Returns extracted data for preview before submission.
    """
    result = await tool_service.extract_from_url(url=data.url)

    if not result:
        raise HTTPException(
            status_code=400,
            detail="Failed to extract data from URL. Please check the URL and try again."
        )

    return result


@router.post("/submit", response_model=ToolResponse)
async def submit_tool_from_url(
    data: ToolURLSubmit,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Submit a new tool using URL extraction.
    The tool will be in pending status until approved.
    """
    # Extract data from URL
    extraction = await tool_service.extract_from_url(data.url)

    if not extraction:
        raise HTTPException(
            status_code=400,
            detail="Failed to extract tool data from URL"
        )

    # Create the tool
    tool = await tool_service.create_from_extraction(
        db=db,
        extraction=extraction,
        website_url=data.url,
        owner_id=UUID(current_user["user_id"])
    )

    return tool


@router.post("", response_model=ToolResponse)
async def create_tool(
    data: ToolCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Create a tool manually with all fields.
    """
    tool = await tool_service.create(
        db=db,
        data=data,
        owner_id=UUID(current_user["user_id"])
    )
    return tool


@router.get("", response_model=PaginatedResponse[ToolListResponse])
async def list_tools(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category_id: Optional[UUID] = None,
    ranking_type: str = Query("default", pattern="^(default|sponsored|featured|trending|newest|top_rated)$"),
    db: AsyncSession = Depends(get_db),
):
    """
    List tools with ranking and pagination.
    """
    offset = (page - 1) * limit

    tools = await ranking_service.get_ranked_tools(
        db=db,
        category_id=category_id,
        limit=limit,
        offset=offset,
        ranking_type=ranking_type
    )

    # Get total count (simplified - in production use count query)
    total = len(tools) + offset if len(tools) == limit else len(tools) + offset

    return PaginatedResponse(
        items=[ToolListResponse.model_validate(t) for t in tools],
        total=total,
        page=page,
        limit=limit,
        pages=(total + limit - 1) // limit,
        has_next=len(tools) == limit,
        has_prev=page > 1
    )


@router.get("/search", response_model=PaginatedResponse[ToolListResponse])
async def search_tools(
    q: str = Query(..., min_length=1, max_length=500),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category_id: Optional[UUID] = None,
    pricing: Optional[List[str]] = Query(None),
    min_rating: Optional[float] = Query(None, ge=0, le=5),
    search_type: str = Query("hybrid", pattern="^(keyword|semantic|hybrid)$"),
    db: AsyncSession = Depends(get_db),
):
    """
    Search tools using keyword, semantic, or hybrid search.
    """
    from app.models.tool import PricingModel

    query = ToolSearchQuery(
        query=q,
        category_id=category_id,
        pricing_models=[PricingModel(p) for p in pricing] if pricing else None,
        min_rating=min_rating,
        search_type=search_type
    )

    offset = (page - 1) * limit
    tools, total = await tool_service.search(
        db=db,
        query=query,
        limit=limit,
        offset=offset
    )

    return PaginatedResponse(
        items=[ToolListResponse.model_validate(t) for t in tools],
        total=total,
        page=page,
        limit=limit,
        pages=(total + limit - 1) // limit if total > 0 else 1,
        has_next=offset + len(tools) < total,
        has_prev=page > 1
    )


@router.get("/{tool_id}", response_model=ToolResponse)
async def get_tool(
    tool_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Get tool by ID.
    """
    tool = await tool_service.get(db, tool_id)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    # Record view
    await tool_service.record_engagement(
        db=db,
        tool_id=tool_id,
        engagement_type=EngagementType.VIEW
    )

    return tool


@router.get("/slug/{slug}", response_model=ToolResponse)
async def get_tool_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get tool by slug.
    """
    tool = await tool_service.get_by_slug(db, slug)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    # Record view
    await tool_service.record_engagement(
        db=db,
        tool_id=tool.id,
        engagement_type=EngagementType.VIEW
    )

    return tool


@router.patch("/{tool_id}", response_model=ToolResponse)
async def update_tool(
    tool_id: UUID,
    data: ToolUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Update a tool (owner or admin only).
    """
    tool = await tool_service.get(db, tool_id)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    # Check ownership
    if str(tool.owner_id) != current_user["user_id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to update this tool")

    updated = await tool_service.update(db, tool, data)
    return updated


@router.delete("/{tool_id}", response_model=BaseResponse)
async def delete_tool(
    tool_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """
    Delete a tool (owner or admin only).
    """
    tool = await tool_service.get(db, tool_id)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    # Check ownership
    if str(tool.owner_id) != current_user["user_id"] and current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Not authorized to delete this tool")

    await tool_service.delete(db, tool)
    return BaseResponse(message="Tool deleted successfully")


@router.post("/{tool_id}/click", response_model=BaseResponse)
async def record_click(
    tool_id: UUID,
    source: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """
    Record a click/redirect for a tool.
    """
    tool = await tool_service.get(db, tool_id)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    await tool_service.record_engagement(
        db=db,
        tool_id=tool_id,
        engagement_type=EngagementType.CLICK,
        source=source
    )

    return BaseResponse(message="Click recorded")


# Admin endpoints
@router.patch("/{tool_id}/ranking", response_model=ToolResponse)
async def update_tool_ranking(
    tool_id: UUID,
    data: ToolRankingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """
    Update tool ranking flags (admin only).
    """
    tool = await tool_service.get(db, tool_id)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    # Update ranking flags
    if data.is_featured is not None:
        tool.is_featured = data.is_featured
    if data.is_sponsored is not None:
        tool.is_sponsored = data.is_sponsored
    if data.is_trending is not None:
        tool.is_trending = data.is_trending
    if data.is_editors_pick is not None:
        tool.is_editors_pick = data.is_editors_pick
    if data.is_internal is not None:
        tool.is_internal = data.is_internal
    if data.sponsored_rank is not None:
        tool.sponsored_rank = data.sponsored_rank
    if data.featured_rank is not None:
        tool.featured_rank = data.featured_rank

    # Recalculate rank score
    tool.rank_score = ranking_service.calculate_rank_score(tool)

    await db.commit()
    await db.refresh(tool)

    return tool


@router.post("/{tool_id}/moderate", response_model=ToolResponse)
async def moderate_tool(
    tool_id: UUID,
    data: ToolModerationAction,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """
    Approve, reject, or archive a tool (admin only).
    Automatically assigns category if missing when approving.
    """
    tool = await tool_service.get(db, tool_id)
    if not tool:
        raise HTTPException(status_code=404, detail="Tool not found")

    if data.action == "approve":
        tool.status = ToolStatus.APPROVED
        
        # Ensure tool has a category assigned
        if not tool.category_id:
            from app.services.llm_extractor import llm_extractor
            
            # Use LLM to classify the category
            category_name = await llm_extractor.classify_category(
                name=tool.name,
                description=tool.short_description,
                tags=tool.tags or []
            )
            
            # Get or create the category
            category = await tool_service._get_or_create_category(db, category_name)
            
            if category:
                tool.category_id = category.id
                
    elif data.action == "reject":
        tool.status = ToolStatus.REJECTED
        tool.rejection_reason = data.reason
    elif data.action == "archive":
        tool.status = ToolStatus.ARCHIVED

    tool.moderated_by = UUID(current_user["user_id"])
    from datetime import datetime
    tool.moderated_at = datetime.utcnow().isoformat()

    await db.commit()
    await db.refresh(tool)

    return tool
