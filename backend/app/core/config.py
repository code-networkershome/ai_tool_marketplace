"""
Application configuration using Pydantic Settings.
All environment variables are loaded and validated here.
"""
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, PostgresDsn, field_validator
from functools import lru_cache
import os
from dotenv import load_dotenv

# Manually load .env to force override any system environment variables
env_path = os.path.join(os.getcwd(), ".env")
if os.path.exists(env_path):
    load_dotenv(env_path, override=True)

class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow"
    )

    # Application
    APP_NAME: str = "AI Tool Marketplace"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = "production"

    # API
    API_V1_PREFIX: str = "/api/v1"
    SECRET_KEY: str = Field(..., description="Secret key for JWT encoding")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ALGORITHM: str = "HS256"

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000","https://ai-tool-marketplace-lybg.vercel.app/"]

    # Database - Supabase PostgreSQL
    DATABASE_URL: PostgresDsn = Field(..., description="Supabase PostgreSQL connection URL")
    DATABASE_POOL_SIZE: int = 5
    DATABASE_MAX_OVERFLOW: int = 10

    # Redis - Upstash (serverless Redis)
    REDIS_URL: str = ""
    CACHE_TTL_SECONDS: int = 300

    # Vector Database (Qdrant) - Cloud
    QDRANT_URL: str = ""
    QDRANT_API_KEY: Optional[str] = None
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

    # Monitoring
    SENTRY_DSN: Optional[str] = None
    LOG_LEVEL: str = "INFO"

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()

settings = get_settings()
