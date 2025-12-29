"""
Ranking algorithm service for tool discovery.
Implements a weighted multi-factor ranking system.
"""
import math
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from uuid import UUID
from sqlalchemy import select, func, and_, or_, desc, asc
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tool import Tool, ToolStatus
from app.models.analytics import RankingConfig
from app.core.config import settings

logger = logging.getLogger(__name__)


class RankingService:
    """
    Multi-factor ranking service for AI tools.

    Ranking factors:
    1. Sponsored weight - Paid placements
    2. Featured weight - Editor curated
    3. Internal boost - Platform-owned tools
    4. Engagement score - User interactions
    5. Review score - Ratings and review count
    6. Freshness score - Recency of listing
    7. Trending score - Recent growth in engagement
    """

    def __init__(self):
        # Default weights (can be overridden from database)
        self.weights = {
            "sponsored": settings.RANKING_WEIGHT_SPONSORED,
            "featured": settings.RANKING_WEIGHT_FEATURED,
            "internal": settings.RANKING_WEIGHT_INTERNAL,
            "engagement": settings.RANKING_WEIGHT_ENGAGEMENT,
            "reviews": settings.RANKING_WEIGHT_REVIEWS,
            "freshness": settings.RANKING_WEIGHT_FRESHNESS,
        }
        self.freshness_decay_days = 30
        self.engagement_decay_days = 7
        self.min_reviews_for_score = 5
        self.trending_threshold = 100

    async def load_config(self, db: AsyncSession):
        """Load ranking configuration from database."""
        try:
            result = await db.execute(
                select(RankingConfig).where(RankingConfig.is_active == "true")
            )
            config = result.scalar_one_or_none()

            if config:
                self.weights = {
                    "sponsored": config.weight_sponsored,
                    "featured": config.weight_featured,
                    "internal": config.weight_internal,
                    "engagement": config.weight_engagement,
                    "reviews": config.weight_reviews,
                    "freshness": config.weight_freshness,
                }
                self.freshness_decay_days = config.freshness_decay_days
                self.engagement_decay_days = config.engagement_decay_days
                self.min_reviews_for_score = config.min_reviews_for_score
                self.trending_threshold = config.trending_threshold
        except Exception as e:
            logger.warning(f"Could not load ranking config: {e}")

    def calculate_rank_score(self, tool: Tool) -> float:
        """
        Calculate the overall rank score for a tool.
        Higher score = higher ranking position.
        """
        score = 0.0

        # 1. Sponsored boost (highest priority)
        if tool.is_sponsored:
            score += self.weights["sponsored"]
            # Manual position override for sponsored
            if tool.sponsored_rank:
                score += (1000 - tool.sponsored_rank)  # Lower rank number = higher score

        # 2. Featured boost
        if tool.is_featured:
            score += self.weights["featured"]
            if tool.featured_rank:
                score += (500 - tool.featured_rank)

        # 3. Internal/platform tool boost
        if tool.is_internal:
            score += self.weights["internal"]

        # 4. Engagement score (normalized)
        engagement_score = self._calculate_engagement_score(tool)
        score += engagement_score * self.weights["engagement"]

        # 5. Review score (weighted by count)
        review_score = self._calculate_review_score(tool)
        score += review_score * self.weights["reviews"]

        # 6. Freshness score (decay over time)
        freshness_score = self._calculate_freshness_score(tool)
        score += freshness_score * self.weights["freshness"]

        # 7. Trending bonus
        if tool.is_trending:
            score += self.weights["engagement"] * 0.5

        # 8. Verified badge bonus
        if tool.is_verified:
            score += 5.0

        return round(score, 4)

    def _calculate_engagement_score(self, tool: Tool) -> float:
        """
        Calculate engagement score based on views, clicks, saves.
        Uses log scaling to prevent runaway scores.
        """
        # Weighted engagement metrics
        raw_score = (
            tool.view_count * 0.1 +
            tool.click_count * 1.0 +
            tool.save_count * 2.0
        )

        # Log scale for diminishing returns
        if raw_score > 0:
            return math.log10(raw_score + 1) * 10
        return 0.0

    def _calculate_review_score(self, tool: Tool) -> float:
        """
        Calculate review score using Bayesian average.
        Prevents tools with few 5-star reviews from dominating.
        """
        if tool.review_count < self.min_reviews_for_score:
            # Not enough reviews - use partial score
            return (tool.average_rating / 5.0) * (tool.review_count / self.min_reviews_for_score) * 10

        # Bayesian average: (avg_rating * review_count + prior_mean * prior_count) / (review_count + prior_count)
        prior_mean = 3.5  # Assume average rating
        prior_count = self.min_reviews_for_score

        bayesian_avg = (
            (tool.average_rating * tool.review_count + prior_mean * prior_count) /
            (tool.review_count + prior_count)
        )

        # Scale to 0-10 range
        return (bayesian_avg / 5.0) * 10

    def _calculate_freshness_score(self, tool: Tool) -> float:
        """
        Calculate freshness score with exponential decay.
        New tools get a boost that decays over time.
        """
        if not tool.created_at:
            return 0.0

        days_old = (datetime.utcnow() - tool.created_at).days

        if days_old <= 0:
            return 10.0  # Max freshness for new tools

        # Exponential decay
        decay_rate = math.log(2) / self.freshness_decay_days  # Half-life
        freshness = 10.0 * math.exp(-decay_rate * days_old)

        return max(0.0, freshness)

    async def update_tool_ranking(self, db: AsyncSession, tool: Tool) -> float:
        """Update and save a tool's rank score."""
        new_score = self.calculate_rank_score(tool)
        tool.rank_score = new_score
        await db.commit()
        return new_score

    async def bulk_update_rankings(self, db: AsyncSession, tool_ids: Optional[List[UUID]] = None):
        """
        Bulk update rankings for multiple tools.
        If no IDs provided, updates all approved tools.
        """
        query = select(Tool).where(Tool.status == ToolStatus.APPROVED)
        if tool_ids:
            query = query.where(Tool.id.in_(tool_ids))

        result = await db.execute(query)
        tools = result.scalars().all()

        for tool in tools:
            tool.rank_score = self.calculate_rank_score(tool)

        await db.commit()
        logger.info(f"Updated rankings for {len(tools)} tools")

    async def get_ranked_tools(
        self,
        db: AsyncSession,
        category_id: Optional[UUID] = None,
        limit: int = 20,
        offset: int = 0,
        ranking_type: str = "default"
    ) -> List[Tool]:
        """
        Get tools sorted by ranking with optional filters.

        Ranking types:
        - default: Overall rank score
        - sponsored: Sponsored first, then by rank
        - featured: Featured first, then by rank
        - trending: Trending tools first
        - newest: By creation date
        - top_rated: By average rating
        """
        query = select(Tool).where(Tool.status == ToolStatus.APPROVED)

        if category_id:
            query = query.where(Tool.category_id == category_id)

        # Apply ranking type ordering
        if ranking_type == "sponsored":
            query = query.order_by(
                desc(Tool.is_sponsored),
                Tool.sponsored_rank.asc().nullslast(),
                desc(Tool.rank_score)
            )
        elif ranking_type == "featured":
            query = query.order_by(
                desc(Tool.is_featured),
                Tool.featured_rank.asc().nullslast(),
                desc(Tool.rank_score)
            )
        elif ranking_type == "trending":
            query = query.order_by(
                desc(Tool.is_trending),
                desc(Tool.rank_score)
            )
        elif ranking_type == "newest":
            query = query.order_by(desc(Tool.created_at))
        elif ranking_type == "top_rated":
            query = query.order_by(
                desc(Tool.average_rating),
                desc(Tool.review_count)
            )
        else:  # default
            query = query.order_by(desc(Tool.rank_score))

        query = query.offset(offset).limit(limit)

        result = await db.execute(query)
        return list(result.scalars().all())

    async def detect_trending(self, db: AsyncSession) -> List[UUID]:
        """
        Detect tools that should be marked as trending.
        Based on recent engagement growth.
        """
        # This would typically compare recent vs historical engagement
        # Simplified version: tools with high recent clicks
        cutoff_date = datetime.utcnow() - timedelta(days=self.engagement_decay_days)

        query = select(Tool).where(
            and_(
                Tool.status == ToolStatus.APPROVED,
                Tool.click_count >= self.trending_threshold
            )
        )

        result = await db.execute(query)
        trending_tools = result.scalars().all()

        trending_ids = []
        for tool in trending_tools:
            if not tool.is_trending:
                tool.is_trending = True
                trending_ids.append(tool.id)

        await db.commit()
        return trending_ids


# Singleton instance
ranking_service = RankingService()
