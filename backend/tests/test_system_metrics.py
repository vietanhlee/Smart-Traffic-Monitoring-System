from app.utils.system_metrics import get_system_metrics


def test_get_system_metrics_shape():
    metrics = get_system_metrics()
    assert isinstance(metrics, dict)
    # Keys exist
    for key in ("cpu_percent", "memory", "disk", "gpu"):
        assert key in metrics
    # Basic structure checks when psutil is available
    mem = metrics.get("memory")
    if isinstance(mem, dict):
        assert {"total", "available", "percent", "used", "free"} <= set(
            mem.keys()
        )
