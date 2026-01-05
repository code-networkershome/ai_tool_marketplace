"""
Database configuration and session management.
Uses SQLAlchemy async for non-blocking database operations.
Compatible with Supabase PostgreSQL (uses PgBouncer).
"""
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool
from typing import AsyncGenerator

from app.core.config import settings

# Convert sync URL to async
def get_async_db_url(url: str) -> str:
    """Convert PostgreSQL URL to async format."""
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    return url

# Create async engine with serverless-friendly settings
engine = create_async_engine(
    url=get_async_db_url(str(settings.DATABASE_URL)),
    echo=settings.DEBUG,
    poolclass=NullPool,  # No pooling - better for serverless
    pool_pre_ping=True,
    connect_timeout=10,
)


# Session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Base class for models
Base = declarative_base()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency for getting database sessions."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Initialize database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """Close database connections."""
    await engine.dispose()
