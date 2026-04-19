from datetime import datetime
from types import SimpleNamespace

from fastapi.testclient import TestClient
import pytest

from app import main as app_main
from app.main import app
from api.v1 import api_road
from utils.traffic_dependencies import get_traffic_runtime


@pytest.fixture(autouse=True)
def disable_external_startup(monkeypatch):
    async def noop_create_tables():
        return

    class DummyTrafficHistoryWorker:
        async def start(self):
            return

        async def stop(self):
            return

    class DummyAnalyzerRuntime:
        def __init__(self):
            self.names = []

        def run_multiprocessing(self):
            return

        def cleanup_processes(self):
            return

    monkeypatch.setattr(app_main, "create_tables", noop_create_tables)
    monkeypatch.setattr(api_road, "AnalyzeOnRoadForMultiprocessing", DummyAnalyzerRuntime)
    monkeypatch.setattr(api_road, "TrafficHistoryWorker", DummyTrafficHistoryWorker)

    app_main.v1.state.analyzer = None
    app_main.v1.state.traffic_history_worker = None

    yield

def test_root_redirects_to_frontend():
    with TestClient(app) as client:
        response = client.get("/", allow_redirects=False)
        assert response.status_code == 307
        assert response.headers["location"] == app_main.settings_network.URL_FRONTEND


def test_get_road_names_returns_available_roads():
    analyzer = SimpleNamespace(names=["Văn Phú", "Đường Láng"])

    with TestClient(app) as client:
        client.app.dependency_overrides[get_traffic_runtime] = lambda: analyzer
        response = client.get("/api/v1/road/roads_name")
        assert response.status_code == 200
        assert response.json() == {"road_names": ["Văn Phú", "Đường Láng"]}
        client.app.dependency_overrides.clear()


def test_get_info_road_returns_enriched_traffic_info():
    analyzer = SimpleNamespace(
        names=["Văn Phú"],
        get_info_road=lambda road_name: {
            "count_car": 2,
            "count_motor": 4,
            "speed_car": 40.0,
            "speed_motor": 35.0,
            "timestamp": datetime.utcnow(),
        },
    )

    with TestClient(app) as client:
        client.app.dependency_overrides[get_traffic_runtime] = lambda: analyzer
        response = client.get("/api/v1/road/info/V%C3%A1n%20Ph%C3%BA")
        assert response.status_code == 200

        body = response.json()
        assert body["count_car"] == 2
        assert body["count_motor"] == 4
        assert body["speed_car"] == 40.0
        assert body["speed_status"] in {"Nhanh chóng", "Chậm chạp"}
        assert body["density_status"] in {"Thông thoáng", "Đông đúc", "Tắc nghẽn"}
        assert "thresholds" in body
        client.app.dependency_overrides.clear()