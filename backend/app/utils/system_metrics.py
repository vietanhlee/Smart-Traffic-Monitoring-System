from __future__ import annotations

from typing import Any, Dict

try:
    import psutil  # type: ignore
except Exception as e:  # pragma: no cover
    psutil = None  # type: ignore


def get_system_metrics() -> Dict[str, Any]:
    """Collect basic system resource metrics.

    Returns a dict with CPU, memory and disk usage. GPU metrics are left as
    a placeholder for future extension.
    """
    if psutil is None:
        return {
            "cpu_percent": None,
            "memory": None,
            "disk": None,
            "gpu": None,
            "error": "psutil not installed",
        }

    cpu_percent = psutil.cpu_percent(interval=0.2)
    vm = psutil.virtual_memory()
    du = psutil.disk_usage("/")

    metrics = {
        "cpu_percent": cpu_percent,
        "memory": {
            "total": vm.total,
            "available": vm.available,
            "percent": vm.percent,
            "used": vm.used,
            "free": vm.free,
        },
        "disk": {
            "total": du.total,
            "used": du.used,
            "free": du.free,
            "percent": du.percent,
        },
        # Placeholder for future GPU stats integration (e.g., GPUtil/NVML)
        "gpu": None,
    }
    return metrics
