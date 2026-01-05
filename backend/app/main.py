"""
FastAPI application entry point.
Configured for both local development and Vercel serverless deployment.
"""
import logging
import sys
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

# Fix for Playwright on Windows with Python 3.8+
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

from app.core.config import settings
from app.core.database import init_db, close_db, AsyncSessionLocal
from app.core.redis import redis_client
from app.api.v1.router import api_router
from app.services.embeddings import embedding_service

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Track if we've initialized
_initialized = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    global _initialized

    # Startup - only initialize once
    if not _initialized:
        logger.info("Starting AI Tool Marketplace API...")

        # Initialize database (with timeout protection)
        try:
            await asyncio.wait_for(init_db(), timeout=5.0)
            logger.info("Database initialized")
        except asyncio.TimeoutError:
            logger.error("Database initialization timed out")
        except Exception as e:
            logger.error(f"Database initialization failed: {e}", exc_info=True)
            # Don't fail the app - allow it to start and handle DB errors per-request

        # Connect to Redis (optional for serverless)
        if settings.REDIS_URL:
            try:
                await asyncio.wait_for(redis_client.connect(), timeout=3.0)
                logger.info("Redis connected")
            except asyncio.TimeoutError:
                logger.warning("Redis connection timed out - continuing without cache")
            except Exception as e:
                logger.warning(f"Redis connection failed: {e} - continuing without cache")
        else:
            logger.info("Redis URL not configured - skipping Redis connection")

        # Connect to vector database (optional for serverless)
        if settings.QDRANT_URL:
            try:
                await asyncio.wait_for(embedding_service.connect(), timeout=5.0)
                logger.info("Vector database connected")
            except asyncio.TimeoutError:
                logger.warning("Vector database connection timed out - continuing without vector search")
            except Exception as e:
                logger.warning(f"Vector database connection failed: {e} - continuing without vector search")
        else:
            logger.info("Qdrant URL not configured - skipping vector database connection")

        _initialized = True

    yield

    # Shutdown - cleanup (with error handling)
    logger.info("Shutting down...")
    try:
        await close_db()
    except Exception as e:
        logger.error(f"Error closing database: {e}")
    
    try:
        await redis_client.disconnect()
    except Exception as e:
        logger.error(f"Error disconnecting Redis: {e}")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="AI Tool Discovery & Ranking Marketplace API",
    docs_url="/docs" if settings.DEBUG else None,
    redoc_url="/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle validation errors."""
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(loc) for loc in error["loc"]),
            "message": error["msg"]
        })
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": "Validation error",
            "details": errors
        }
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle uncaught exceptions."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": "Internal server error",
            "detail": str(exc) if settings.DEBUG else None
        }
    )


# Rate limiting middleware (optional Redis dependency)
@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    """Apply rate limiting per IP."""
    if settings.ENVIRONMENT != "development":
        client_ip = request.client.host
        try:
            is_allowed, remaining = await redis_client.check_rate_limit(
                identifier=f"ip:{client_ip}",
                limit=settings.RATE_LIMIT_REQUESTS,
                window=settings.RATE_LIMIT_WINDOW
            )

            if not is_allowed:
                return JSONResponse(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    content={"error": "Rate limit exceeded"},
                    headers={"X-RateLimit-Remaining": str(remaining)}
                )
        except Exception:
            pass  # Fail open if Redis is down

    response = await call_next(request)
    return response


# Include API router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT
    }


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "docs": "/docs" if settings.DEBUG else "Disabled in production"
    }
