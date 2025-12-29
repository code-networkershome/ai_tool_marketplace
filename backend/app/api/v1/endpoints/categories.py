"""
Category API endpoints.
"""
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import require_admin
from app.models.category import Category
from app.models.tool import Tool, ToolStatus
from app.schemas.category import (
    CategoryCreate, CategoryUpdate, CategoryResponse,
    CategoryListResponse, CategoryWithChildren
)
from app.schemas.common import BaseResponse

router = APIRouter()


@router.get("", response_model=List[CategoryListResponse])
async def list_categories(
    include_inactive: bool = Query(False),
    featured_only: bool = Query(False),
    db: AsyncSession = Depends(get_db),
):
    """
    List all categories.
    """
    query = select(Category)

    if not include_inactive:
        query = query.where(Category.is_active == True)
    if featured_only:
        query = query.where(Category.is_featured == True)

    query = query.order_by(Category.sort_order, Category.name)

    result = await db.execute(query)
    categories = result.scalars().all()

    return [CategoryListResponse.model_validate(c) for c in categories]


@router.get("/tree", response_model=List[CategoryWithChildren])
async def get_category_tree(
    db: AsyncSession = Depends(get_db),
):
    """
    Get categories as a nested tree structure.
    """
    query = select(Category).where(
        Category.is_active == True,
        Category.parent_id == None
    ).order_by(Category.sort_order)

    result = await db.execute(query)
    root_categories = result.scalars().all()

    # Build tree (simplified - for deep nesting, use recursive query)
    async def build_children(parent_id: UUID) -> List[CategoryWithChildren]:
        child_query = select(Category).where(
            Category.parent_id == parent_id,
            Category.is_active == True
        ).order_by(Category.sort_order)
        child_result = await db.execute(child_query)
        children = child_result.scalars().all()

        return [
            CategoryWithChildren(
                **CategoryResponse.model_validate(c).model_dump(),
                children=await build_children(c.id)
            )
            for c in children
        ]

    tree = []
    for cat in root_categories:
        tree.append(CategoryWithChildren(
            **CategoryResponse.model_validate(cat).model_dump(),
            children=await build_children(cat.id)
        ))

    return tree


@router.get("/{category_id}", response_model=CategoryResponse)
async def get_category(
    category_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Get category by ID.
    """
    category = await db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    return CategoryResponse.model_validate(category)


@router.get("/slug/{slug}", response_model=CategoryResponse)
async def get_category_by_slug(
    slug: str,
    db: AsyncSession = Depends(get_db),
):
    """
    Get category by slug.
    """
    result = await db.execute(
        select(Category).where(Category.slug == slug)
    )
    category = result.scalar_one_or_none()

    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    return CategoryResponse.model_validate(category)


@router.get("/{category_id}/tools")
async def get_category_tools(
    category_id: UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """
    Get tools in a category with pagination.
    """
    from app.services.ranking import ranking_service
    from app.schemas.tool import ToolListResponse
    from app.schemas.common import PaginatedResponse

    category = await db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    offset = (page - 1) * limit

    tools = await ranking_service.get_ranked_tools(
        db=db,
        category_id=category_id,
        limit=limit,
        offset=offset
    )

    # Get total count
    count_query = select(func.count(Tool.id)).where(
        Tool.category_id == category_id,
        Tool.status == ToolStatus.APPROVED
    )
    total = (await db.execute(count_query)).scalar() or 0

    return PaginatedResponse(
        items=[ToolListResponse.model_validate(t) for t in tools],
        total=total,
        page=page,
        limit=limit,
        pages=(total + limit - 1) // limit if total > 0 else 1,
        has_next=offset + len(tools) < total,
        has_prev=page > 1
    )


# Admin endpoints
@router.post("", response_model=CategoryResponse)
async def create_category(
    data: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """
    Create a new category (admin only).
    """
    # Check if slug exists
    existing = await db.execute(
        select(Category).where(Category.slug == data.slug)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Category with this slug already exists")

    category = Category(
        name=data.name,
        slug=data.slug,
        description=data.description,
        icon=data.icon,
        color=data.color,
        parent_id=data.parent_id,
        sort_order=data.sort_order,
        is_active=True
    )

    db.add(category)
    await db.commit()
    await db.refresh(category)

    return CategoryResponse.model_validate(category)


@router.patch("/{category_id}", response_model=CategoryResponse)
async def update_category(
    category_id: UUID,
    data: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """
    Update a category (admin only).
    """
    category = await db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)

    await db.commit()
    await db.refresh(category)

    return CategoryResponse.model_validate(category)


@router.delete("/{category_id}", response_model=BaseResponse)
async def delete_category(
    category_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(require_admin),
):
    """
    Delete a category (admin only).
    """
    category = await db.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Check if category has tools
    tool_count = await db.execute(
        select(func.count(Tool.id)).where(Tool.category_id == category_id)
    )
    if tool_count.scalar() > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete category with existing tools"
        )

    await db.delete(category)
    await db.commit()

    return BaseResponse(message="Category deleted successfully")
