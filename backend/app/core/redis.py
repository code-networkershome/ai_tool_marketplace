"""
Redis client for caching and rate limiting.
"""
import redis.asyncio as redis
from typing import Optional, Any
import json

from app.core.config import settings


class RedisClient:
    """Async Redis client wrapper."""

    def __init__(self):
        self._client: Optional[redis.Redis] = None

    async def connect(self):
        """Connect to Redis."""
        if not settings.REDIS_URL:
            raise ValueError("REDIS_URL is not configured")
        self._client = redis.from_url(
            settings.REDIS_URL,
            encoding="utf-8",
            decode_responses=True
        )

    async def disconnect(self):
        """Disconnect from Redis."""
        if self._client:
            await self._client.close()

    @property
    def client(self) -> redis.Redis:
        if not self._client:
            raise RuntimeError("Redis client not connected")
        return self._client

    async def get(self, key: str) -> Optional[str]:
        """Get a value from cache."""
        return await self.client.get(key)

    async def set(
        self,
        key: str,
        value: Any,
        ttl: int = None
    ):
        """Set a value in cache."""
        ttl = ttl or settings.CACHE_TTL_SECONDS
        if isinstance(value, (dict, list)):
            value = json.dumps(value)
        await self.client.set(key, value, ex=ttl)

    async def delete(self, key: str):
        """Delete a key from cache."""
        await self.client.delete(key)

    async def get_json(self, key: str) -> Optional[dict]:
        """Get and parse JSON value."""
        value = await self.get(key)
        if value:
            return json.loads(value)
        return None

    async def increment(self, key: str, ttl: int = None) -> int:
        """Increment a counter."""
        count = await self.client.incr(key)
        if ttl and count == 1:
            await self.client.expire(key, ttl)
        return count

    async def check_rate_limit(
        self,
        identifier: str,
        limit: int = None,
        window: int = None
    ) -> tuple[bool, int]:
        """
        Check rate limit for an identifier.
        Returns (is_allowed, remaining_requests).
        """
        limit = limit or settings.RATE_LIMIT_REQUESTS
        window = window or settings.RATE_LIMIT_WINDOW
        key = f"rate_limit:{identifier}"

        current = await self.increment(key, ttl=window)
        remaining = max(0, limit - current)
        is_allowed = current <= limit

        return is_allowed, remaining


# Global Redis instance
redis_client = RedisClient()


async def get_redis() -> RedisClient:
    """Dependency for getting Redis client."""
    return redis_client
