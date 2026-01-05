# Vercel FUNCTION_INVOCATION_FAILED Fix

## Error Analysis

The error `TypeError: issubclass() arg 1 must be a class` occurs in Vercel's internal handler detection code (`vc__handler__python.py`). This happens when Vercel tries to introspect the handler module to determine what type of handler it is.

## Root Cause

1. **Handler Export Issue**: The try/except block in `api/main.py` was creating a function handler as fallback when imports failed. Vercel's introspection code expects a Mangum instance (or other specific handler types), not a function.

2. **Import-Time Failures**: If Settings validation fails during import (missing required env vars), it can cause module-level issues that confuse Vercel's handler detection.

## The Fix

Simplified `backend/api/main.py` to:
- Remove try/except wrapper (let errors bubble up clearly)
- Always export a Mangum instance
- Clean, simple handler export

## Verification Steps

1. **Check Environment Variables** in Vercel Dashboard:
   - `SECRET_KEY` (required)
   - `DATABASE_URL` (required) 
   - `OPENAI_API_KEY` (required)
   - `REDIS_URL` (optional)
   - `QDRANT_URL` (optional)

2. **Deploy and Check Logs**: Any import errors will now show clearly in Vercel logs instead of the confusing issubclass error.

3. **Test the Handler**: The `/health` endpoint should work if env vars are set correctly.

## If Issues Persist

If you still see errors, check Vercel function logs for:
- Missing environment variables (Settings validation errors)
- Import errors (missing dependencies)
- Database connection issues (will be logged, won't crash app)

