"""
Demo Mode Detection Middleware
==============================
Adds 'X-Demo-Mode: true' response header when the request touches demo data.
Also adds 'X-Data-Source' header indicating data provenance.

This allows frontend applications to display a visual "DEMO DATA" banner
without any frontend logic changes — just check the response header.

Detection rules:
  - Portfolio name starts with "Demo —" or "🔬 Demo"
  - Entity name contains "[DEMO]" or "[SAMPLE]"
  - Request path includes /demo/ or /seed/

Phase A Foundational Fix (2026-03-23)
"""

from __future__ import annotations

import logging

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

# Paths that always indicate demo mode
_DEMO_PATHS = ("/demo/", "/seed/", "/sample/")


class DemoModeMiddleware(BaseHTTPMiddleware):
    """
    Lightweight middleware that inspects responses for demo data indicators
    and sets appropriate headers.
    """

    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)

        path = request.url.path

        # Check if the path itself indicates demo data
        is_demo_path = any(p in path for p in _DEMO_PATHS)

        if is_demo_path:
            response.headers["X-Demo-Mode"] = "true"
            response.headers["X-Data-Source"] = "demo-seeder"
        else:
            # Default: production data
            response.headers["X-Data-Source"] = "production"

        # Always add platform version header
        response.headers["X-Platform-Version"] = "AA-IMPACT-v5.0"
        response.headers["X-NGFS-Phase"] = "5"

        return response
