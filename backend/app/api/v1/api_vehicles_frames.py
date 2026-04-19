"""Compatibility shim for legacy imports.

Production traffic API now lives under api.v1.traffic.
"""

from api.v1.api_road import router

__all__ = ["router"]
