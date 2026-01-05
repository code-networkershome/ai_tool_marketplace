"""
Vercel API Entry Point for FastAPI
This file wraps the FastAPI app for Vercel serverless deployment.
"""
import sys
import os

# Add parent directory to path for imports
# This ensures 'app' module can be found
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from mangum import Mangum
from app.main import app

# Vercel handler - must be named 'handler'
# Mangum automatically handles FastAPI lifespan events
# Vercel's Python runtime expects this to be a Mangum instance, not a function
handler = Mangum(app)