"""
Tool service - main business logic for tool operations.
"""
import re
import logging
from typing import Optional, List, Tuple
from uuid import UUID
from datetime import datetime
from sqlalchemy import select, func, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tool import Tool, ToolStatus, PricingModel
from app.models.category import Category
from app.models.engagement import Engagement, EngagementType, Review
from app.schemas.tool import (
    ToolCreate, ToolUpdate, ToolURLSubmit,
    ToolExtractionResult, ToolSearchQuery, ToolRankingUpdate
)
from app.services.scraper import scraper
from app.services.llm_extractor import llm_extractor
from app.services.embeddings import embedding_service
from app.services.ranking import ranking_service

logger = logging.getLogger(__name__)


class ToolService:
    """Service for tool CRUD and business operations."""

    def slugify(self, text: str) -> str:
        """Generate URL-safe slug from text."""
        slug = text.lower().strip()
        slug = re.sub(r'[^\w\s-]', '', slug)
        slug = re.sub(r'[-\s]+', '-', slug)
        return slug[:100]

    async def get_unique_slug(self, db: AsyncSession, base_slug: str) -> str:
        """Generate unique slug by appending numbers if needed."""
        slug = base_slug
        counter = 1

        while True:
            result = await db.execute(
                select(Tool).where(Tool.slug == slug)
            )
            if not result.scalar_one_or_none():
                return slug
            slug = f"{base_slug}-{counter}"
            counter += 1

    async def extract_from_url(
        self,
        url: str,
        use_playwright: bool = True
    ) -> Optional[ToolExtractionResult]:
        """
        Extract tool information from URL using scraper + LLM.
        """
        logger.info(f"Extracting tool data from: {url}")

        # Step 1: Scrape the website
        html = await scraper.fetch(url, use_playwright=use_playwright)
        if not html:
            logger.error(f"Failed to fetch URL: {url}")
            return None

        # Step 2: Clean and structure HTML content
        cleaned_content = scraper.clean_html(html)

        # Step 3: Use LLM to extract structured data
        extraction_result = await llm_extractor.extract_tool_data(url, cleaned_content)

        if extraction_result:
            logger.info(f"Successfully extracted: {extraction_result.name}")

        return extraction_result

    async def create_from_extraction(
        self,
        db: AsyncSession,
        extraction: ToolExtractionResult,
        website_url: str,
        owner_id: UUID
    ) -> Tool:
        """Create a tool from extraction result."""
        # Find or create category
        category = await self._get_or_create_category(db, extraction.category)

        # Generate unique slug
        slug = await self.get_unique_slug(db, self.slugify(extraction.name))

        # Map pricing model
        pricing_map = {
            "free": PricingModel.FREE,
            "freemium": PricingModel.FREEMIUM,
            "paid": PricingModel.PAID,
            "subscription": PricingModel.SUBSCRIPTION,
            "usage_based": PricingModel.USAGE_BASED,
            "contact": PricingModel.CONTACT,
            "open_source": PricingModel.OPEN_SOURCE,
        }
        pricing_model = pricing_map.get(extraction.pricing_model, PricingModel.FREEMIUM)

        # Create tool
        tool = Tool(
            name=extraction.name,
            slug=slug,
            short_description=extraction.short_description,
            long_description=extraction.long_description,
            website_url=website_url,
            category_id=category.id if category else None,
            tags=extraction.tags,
            use_cases=extraction.use_cases,
            pricing_model=pricing_model,
            pricing_details=extraction.pricing_details,
            logo_url=extraction.logo_url,
            github_url=extraction.github_url,
            twitter_url=extraction.twitter_url,
            owner_id=owner_id,
            status=ToolStatus.PENDING,
            extracted_data=extraction.raw_data,
            last_scraped_at=datetime.utcnow().isoformat(),
        )

        db.add(tool)
        await db.commit()
        await db.refresh(tool)

        # Index in vector database
        await embedding_service.index_tool(
            tool_id=tool.id,
            name=tool.name,
            description=tool.short_description,
            category=extraction.category,
            tags=extraction.tags
        )

        logger.info(f"Created tool: {tool.name} ({tool.id})")
        return tool

    async def create(
        self,
        db: AsyncSession,
        data: ToolCreate,
        owner_id: UUID
    ) -> Tool:
        """Create a tool manually."""
        slug = await self.get_unique_slug(db, self.slugify(data.name))

        tool = Tool(
            name=data.name,
            slug=slug,
            short_description=data.short_description,
            long_description=data.long_description,
            tagline=data.tagline,
            website_url=str(data.website_url),
            category_id=data.category_id,
            tags=data.tags,
            use_cases=data.use_cases,
            pricing_model=data.pricing_model,
            pricing_details=data.pricing_details,
            starting_price=data.starting_price,
            logo_url=data.logo_url,
            screenshot_url=data.screenshot_url,
            demo_url=data.demo_url,
            docs_url=data.docs_url,
            github_url=data.github_url,
            twitter_url=data.twitter_url,
            linkedin_url=data.linkedin_url,
            discord_url=data.discord_url,
            youtube_url=data.youtube_url,
            owner_id=owner_id,
            status=ToolStatus.PENDING,
        )

        db.add(tool)
        await db.commit()
        await db.refresh(tool)

        # Get category name for embedding
        category_name = "Other"
        if data.category_id:
            cat = await db.get(Category, data.category_id)
            category_name = cat.name if cat else "Other"

        # Index in vector database
        await embedding_service.index_tool(
            tool_id=tool.id,
            name=tool.name,
            description=tool.short_description,
            category=category_name,
            tags=data.tags
        )

        return tool

    async def get(self, db: AsyncSession, tool_id: UUID) -> Optional[Tool]:
        """Get tool by ID."""
        return await db.get(Tool, tool_id)

    async def get_by_slug(self, db: AsyncSession, slug: str) -> Optional[Tool]:
        """Get tool by slug."""
        result = await db.execute(
            select(Tool).where(Tool.slug == slug)
        )
        return result.scalar_one_or_none()

    async def update(
        self,
        db: AsyncSession,
        tool: Tool,
        data: ToolUpdate
    ) -> Tool:
        """Update tool fields."""
        update_data = data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(tool, field, value)

        tool.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(tool)

        # Update embedding if relevant fields changed
        if any(f in update_data for f in ["name", "short_description", "tags"]):
            category_name = "Other"
            if tool.category_id:
                cat = await db.get(Category, tool.category_id)
                category_name = cat.name if cat else "Other"

            await embedding_service.update_tool(
                tool_id=tool.id,
                name=tool.name,
                description=tool.short_description,
                category=category_name,
                tags=tool.tags or []
            )

        return tool

    async def delete(self, db: AsyncSession, tool: Tool):
        """Delete a tool."""
        # Remove from vector database
        await embedding_service.delete_tool(tool.id)

        await db.delete(tool)
        await db.commit()

    async def search(
        self,
        db: AsyncSession,
        query: ToolSearchQuery,
        limit: int = 20,
        offset: int = 0
    ) -> Tuple[List[Tool], int]:
        """
        Search tools using keyword and/or semantic search.
        """
        if query.search_type == "semantic":
            return await self._semantic_search(db, query, limit, offset)
        elif query.search_type == "keyword":
            return await self._keyword_search(db, query, limit, offset)
        else:  # hybrid
            return await self._hybrid_search(db, query, limit, offset)

    async def _keyword_search(
        self,
        db: AsyncSession,
        query: ToolSearchQuery,
        limit: int,
        offset: int
    ) -> Tuple[List[Tool], int]:
        """Perform keyword-based search."""
        search_query = select(Tool).where(Tool.status == ToolStatus.APPROVED)

        # Text search on name and description
        search_term = f"%{query.query}%"
        search_query = search_query.where(
            or_(
                Tool.name.ilike(search_term),
                Tool.short_description.ilike(search_term),
                Tool.tags.any(query.query.lower())
            )
        )

        # Apply filters
        if query.category_id:
            search_query = search_query.where(Tool.category_id == query.category_id)
        if query.pricing_models:
            search_query = search_query.where(Tool.pricing_model.in_(query.pricing_models))
        if query.min_rating:
            search_query = search_query.where(Tool.average_rating >= query.min_rating)
        if query.tags:
            search_query = search_query.where(Tool.tags.overlap(query.tags))

        # Get total count
        count_query = select(func.count()).select_from(search_query.subquery())
        total = (await db.execute(count_query)).scalar() or 0

        # Apply ordering and pagination
        search_query = search_query.order_by(Tool.rank_score.desc())
        search_query = search_query.offset(offset).limit(limit)

        result = await db.execute(search_query)
        tools = list(result.scalars().all())

        return tools, total

    async def _semantic_search(
        self,
        db: AsyncSession,
        query: ToolSearchQuery,
        limit: int,
        offset: int
    ) -> Tuple[List[Tool], int]:
        """Perform semantic vector search."""
        # Get category name if filter applied
        category_name = None
        if query.category_id:
            cat = await db.get(Category, query.category_id)
            category_name = cat.name if cat else None

        # Search vector database
        semantic_results = await embedding_service.search_similar(
            query=query.query,
            limit=limit + offset,  # Get extra for offset
            category=category_name,
            tags=query.tags
        )

        if not semantic_results:
            return [], 0

        # Get tool IDs
        tool_ids = [UUID(r["tool_id"]) for r in semantic_results]

        # Fetch full tool objects
        tools_query = select(Tool).where(
            and_(
                Tool.id.in_(tool_ids),
                Tool.status == ToolStatus.APPROVED
            )
        )

        # Apply additional filters
        if query.pricing_models:
            tools_query = tools_query.where(Tool.pricing_model.in_(query.pricing_models))
        if query.min_rating:
            tools_query = tools_query.where(Tool.average_rating >= query.min_rating)

        result = await db.execute(tools_query)
        tools_map = {t.id: t for t in result.scalars().all()}

        # Order by semantic score
        ordered_tools = [
            tools_map[UUID(r["tool_id"])]
            for r in semantic_results
            if UUID(r["tool_id"]) in tools_map
        ]

        # Apply offset
        ordered_tools = ordered_tools[offset:offset + limit]

        return ordered_tools, len(semantic_results)

    async def _hybrid_search(
        self,
        db: AsyncSession,
        query: ToolSearchQuery,
        limit: int,
        offset: int
    ) -> Tuple[List[Tool], int]:
        """Combine keyword and semantic search with score fusion."""
        # Get results from both methods
        keyword_results, _ = await self._keyword_search(db, query, limit * 2, 0)
        semantic_results, _ = await self._semantic_search(db, query, limit * 2, 0)

        # Score fusion using Reciprocal Rank Fusion (RRF)
        k = 60  # RRF constant
        scores = {}

        for rank, tool in enumerate(keyword_results):
            scores[tool.id] = scores.get(tool.id, 0) + 1 / (k + rank + 1)

        for rank, tool in enumerate(semantic_results):
            scores[tool.id] = scores.get(tool.id, 0) + 1 / (k + rank + 1)

        # Sort by combined score
        sorted_ids = sorted(scores.keys(), key=lambda x: scores[x], reverse=True)

        # Fetch tools in order
        tools_query = select(Tool).where(Tool.id.in_(sorted_ids))
        result = await db.execute(tools_query)
        tools_map = {t.id: t for t in result.scalars().all()}

        ordered_tools = [tools_map[tid] for tid in sorted_ids if tid in tools_map]

        return ordered_tools[offset:offset + limit], len(ordered_tools)

    async def record_engagement(
        self,
        db: AsyncSession,
        tool_id: UUID,
        engagement_type: EngagementType,
        user_id: Optional[UUID] = None,
        session_id: Optional[str] = None,
        source: Optional[str] = None
    ):
        """Record user engagement with a tool."""
        engagement = Engagement(
            tool_id=tool_id,
            user_id=user_id,
            session_id=session_id,
            engagement_type=engagement_type,
            source=source
        )
        db.add(engagement)

        # Update denormalized counts on tool
        tool = await db.get(Tool, tool_id)
        if tool:
            if engagement_type == EngagementType.VIEW:
                tool.view_count += 1
            elif engagement_type == EngagementType.CLICK:
                tool.click_count += 1
            elif engagement_type == EngagementType.SAVE:
                tool.save_count += 1

            # Recalculate ranking
            tool.rank_score = ranking_service.calculate_rank_score(tool)

        await db.commit()

    async def _get_or_create_category(
        self,
        db: AsyncSession,
        category_name: str
    ) -> Optional[Category]:
        """Get existing category or create new one."""
        slug = self.slugify(category_name)

        result = await db.execute(
            select(Category).where(
                or_(
                    Category.name.ilike(category_name),
                    Category.slug == slug
                )
            )
        )
        category = result.scalar_one_or_none()

        if not category:
            category = Category(
                name=category_name,
                slug=slug,
                is_active=True
            )
            db.add(category)
            await db.commit()
            await db.refresh(category)

        return category


# Singleton instance
tool_service = ToolService()
