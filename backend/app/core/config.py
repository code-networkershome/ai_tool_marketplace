"""
Application configuration using Pydantic Settings.
All environment variables are loaded and validated here.
"""
from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field, PostgresDsn, field_validator
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    APP_NAME: str = "AI Tool Marketplace"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "development"

    # API
    API_V1_PREFIX: str = "/api/v1"
    SECRET_KEY: str = Field(..., description="Secret key for JWT encoding")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALGORITHM: str = "HS256"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]

    # Database
    DATABASE_URL: PostgresDsn = Field(..., description="PostgreSQL connection URL")
    DATABASE_POOL_SIZE: int = 5
    DATABASE_MAX_OVERFLOW: int = 10

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    CACHE_TTL_SECONDS: int = 300

    # Vector Database (Qdrant)
    QDRANT_HOST: str = "localhost"
    QDRANT_PORT: int = 6333
    QDRANT_COLLECTION: str = "tool_embeddings"

    # OpenAI / LLM
    OPENAI_API_KEY: str = Field(..., description="OpenAI API key for LLM operations")
    LLM_MODEL: str = "gpt-4o-mini"
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    EMBEDDING_DIMENSIONS: int = 1536

    # Scraping
    SCRAPER_USER_AGENT: str = "AIToolMarketplace/1.0 (+https://aitoolmarketplace.com)"
    SCRAPER_TIMEOUT: int = 30
    SCRAPER_MAX_RETRIES: int = 3
    PLAYWRIGHT_ENABLED: bool = True

    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60

    # Ranking Weights (configurable)
    RANKING_WEIGHT_SPONSORED: float = 100.0
    RANKING_WEIGHT_FEATURED: float = 50.0
    RANKING_WEIGHT_ENGAGEMENT: float = 30.0
    RANKING_WEIGHT_REVIEWS: float = 20.0
    RANKING_WEIGHT_FRESHNESS: float = 10.0
    RANKING_WEIGHT_INTERNAL: float = 80.0

    # Background Jobs
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # Monitoring
    SENTRY_DSN: Optional[str] = None
    LOG_LEVEL: str = "INFO"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


settings = get_settings()
