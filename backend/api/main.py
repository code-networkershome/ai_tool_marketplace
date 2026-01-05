"""
Vercel API Entry Point for FastAPI
This file wraps the FastAPI app for Vercel serverless deployment.
"""
import sys
import os
import logging

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Configure logging for Vercel
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

try:
    from mangum import Mangum
    from app.main import app
    
    # Vercel handler - must be named 'handler'
    # Mangum automatically handles FastAPI lifespan events
    handler = Mangum(app)
    logger.info("Handler initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize handler: {e}", exc_info=True)
    # Create a minimal error handler that returns proper Lambda response
    def handler(event, context):
        return {
            "statusCode": 500,
            "headers": {"Content-Type": "application/json"},
            "body": f'{{"error": "Initialization error: {str(e)}"}}'
        }