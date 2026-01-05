"""
Vercel API Entry Point for FastAPI
This file wraps the FastAPI app for Vercel serverless deployment.
"""
from app.main import app

# Vercel handler
handler = app
