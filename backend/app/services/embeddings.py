"""
Embedding service for semantic search using OpenAI and Qdrant.
Supports both local Qdrant and Qdrant Cloud.
"""
import logging
from typing import List, Optional, Dict, Any
from uuid import UUID
from openai import AsyncOpenAI
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct,
    Filter, FieldCondition, MatchValue,
    SearchParams
)

from app.core.config import settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    """Service for generating and searching embeddings."""

    def __init__(self):
        self.openai_client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.qdrant_client: Optional[QdrantClient] = None
        self.collection_name = settings.QDRANT_COLLECTION
        self.embedding_model = settings.EMBEDDING_MODEL
        self.dimensions = settings.EMBEDDING_DIMENSIONS

    async def connect(self):
        """Connect to Qdrant (local or cloud)."""
        try:
            # Check if QDRANT_URL is set for cloud deployment
            if settings.QDRANT_URL and not settings.QDRANT_URL.startswith("http://localhost"):
                # Qdrant Cloud
                self.qdrant_client = QdrantClient(
                    url=settings.QDRANT_URL,
                    api_key=settings.QDRANT_API_KEY
                )
                logger.info(f"Connected to Qdrant Cloud: {settings.QDRANT_URL}")
            elif settings.QDRANT_URL and settings.QDRANT_URL.startswith("http://localhost"):
                # Local Qdrant via URL
                self.qdrant_client = QdrantClient(url=settings.QDRANT_URL)
                logger.info(f"Connected to local Qdrant: {settings.QDRANT_URL}")
            else:
                # No Qdrant configured
                logger.info("Qdrant URL not configured - vector search will be disabled")
                return

            # Ensure collection exists
            self._ensure_collection()
        except Exception as e:
            logger.error(f"Failed to connect to Qdrant: {e}")
            # Don't raise - allow app to continue without vector DB

    def _ensure_collection(self):
        """Create collection if it doesn't exist."""
        if not self.qdrant_client:
            return

        try:
            collections = self.qdrant_client.get_collections().collections
            if not any(c.name == self.collection_name for c in collections):
                self.qdrant_client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=self.dimensions,
                        distance=Distance.COSINE
                    )
                )
                logger.info(f"Created collection: {self.collection_name}")
        except Exception as e:
            logger.warning(f"Could not ensure collection exists: {e}")

    async def generate_embedding(self, text: str) -> Optional[List[float]]:
        """Generate embedding for text using OpenAI."""
        try:
            response = await self.openai_client.embeddings.create(
                model=self.embedding_model,
                input=text
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Embedding generation error: {e}")
            return None

    async def index_tool(
        self,
        tool_id: UUID,
        name: str,
        description: str,
        category: str,
        tags: List[str]
    ) -> Optional[str]:
        """
        Index a tool in the vector database.
        Returns the embedding ID.
        """
        if not self.qdrant_client:
            logger.warning("Qdrant client not connected")
            return None

        # Create combined text for embedding
        text = f"{name}. {description}. Category: {category}. Tags: {', '.join(tags)}"

        # Generate embedding
        embedding = await self.generate_embedding(text)
        if not embedding:
            return None

        # Create point ID from tool UUID
        point_id = str(tool_id)

        try:
            # Upsert to Qdrant
            self.qdrant_client.upsert(
                collection_name=self.collection_name,
                points=[
                    PointStruct(
                        id=point_id,
                        vector=embedding,
                        payload={
                            "tool_id": str(tool_id),
                            "name": name,
                            "category": category,
                            "tags": tags
                        }
                    )
                ]
            )
            return point_id
        except Exception as e:
            logger.error(f"Failed to index tool: {e}")
            return None

    async def search_similar(
        self,
        query: str,
        limit: int = 20,
        category: Optional[str] = None,
        tags: Optional[List[str]] = None,
        score_threshold: float = 0.5
    ) -> List[Dict[str, Any]]:
        """
        Search for similar tools using semantic search.
        """
        if not self.qdrant_client:
            logger.warning("Qdrant client not connected")
            return []

        # Generate query embedding
        query_embedding = await self.generate_embedding(query)
        if not query_embedding:
            return []

        # Build filters
        filters = []
        if category:
            filters.append(
                FieldCondition(
                    key="category",
                    match=MatchValue(value=category)
                )
            )

        search_filter = Filter(must=filters) if filters else None

        try:
            # Search Qdrant
            results = self.qdrant_client.search(
                collection_name=self.collection_name,
                query_vector=query_embedding,
                query_filter=search_filter,
                limit=limit,
                score_threshold=score_threshold,
                search_params=SearchParams(hnsw_ef=128, exact=False)
            )

            return [
                {
                    "tool_id": hit.payload["tool_id"],
                    "score": hit.score,
                    "name": hit.payload.get("name"),
                    "category": hit.payload.get("category")
                }
                for hit in results
            ]

        except Exception as e:
            logger.error(f"Semantic search error: {e}")
            return []

    async def delete_tool(self, tool_id: UUID) -> bool:
        """Remove a tool from the vector database."""
        if not self.qdrant_client:
            return False

        try:
            self.qdrant_client.delete(
                collection_name=self.collection_name,
                points_selector=[str(tool_id)]
            )
            return True
        except Exception as e:
            logger.error(f"Failed to delete tool embedding: {e}")
            return False

    async def update_tool(
        self,
        tool_id: UUID,
        name: str,
        description: str,
        category: str,
        tags: List[str]
    ) -> bool:
        """Update a tool's embedding."""
        # Simply re-index (upsert handles update)
        result = await self.index_tool(tool_id, name, description, category, tags)
        return result is not None


# Singleton instance
embedding_service = EmbeddingService()
