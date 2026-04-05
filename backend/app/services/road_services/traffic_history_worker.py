import asyncio
import importlib
import json
import logging
import multiprocessing
from datetime import datetime, timezone

from core.config import settings_server
from db.base import AsyncSessionLocal
from models.traffic_history import TrafficHistory


logger = logging.getLogger(__name__)


async def _insert_history_row(payload: dict):
	recorded_at_raw = payload.get("timestamp")
	try:
		normalized = str(recorded_at_raw).replace("Z", "+00:00") if recorded_at_raw else None
		recorded_at = datetime.fromisoformat(normalized) if normalized else datetime.now(timezone.utc)
	except Exception:
		recorded_at = datetime.now(timezone.utc)

	row = TrafficHistory(
		road_name=str(payload.get("road_name", "unknown")),
		recorded_at=recorded_at,
		avg_count_car=int(payload.get("count_car", 0) or 0),
		avg_count_motor=int(payload.get("count_motor", 0) or 0),
		avg_speed_car=float(payload.get("speed_car", 0) or 0),
		avg_speed_motor=float(payload.get("speed_motor", 0) or 0),
	)

	async with AsyncSessionLocal() as session:
		session.add(row)
		await session.commit()


async def _run_worker_loop(redis_url: str, queue_key: str, stop_event):
	redis_module = importlib.import_module("redis")
	redis_client = redis_module.Redis.from_url(redis_url, decode_responses=True)

	try:
		while not stop_event.is_set():
			try:
				item = await asyncio.to_thread(redis_client.brpop, queue_key, 1)
				if not item:
					continue

				_, payload = item
				data = json.loads(payload)
				await _insert_history_row(data)
			except Exception as exc:
				logger.exception("TrafficHistoryWorker process error: %s", exc)
				await asyncio.sleep(0.5)
	finally:
		await asyncio.to_thread(redis_client.close)


def _process_entrypoint(redis_url: str, queue_key: str, stop_event):
	try:
		asyncio.run(_run_worker_loop(redis_url=redis_url, queue_key=queue_key, stop_event=stop_event))
	except Exception as exc:
		logger.exception("TrafficHistoryWorker crashed: %s", exc)


class TrafficHistoryWorker:
	"""Worker chạy nền trong process riêng: đọc Redis queue và ghi tuần tự vào database."""

	def __init__(self, redis_url: str = settings_server.REDIS_URL, queue_key: str = "traffic:history:queue"):
		self.redis_url = redis_url
		self.queue_key = queue_key
		self._process = None
		self._stop_event = None

	async def start(self):
		if self._process is not None and self._process.is_alive():
			return

		ctx = multiprocessing.get_context("spawn")
		self._stop_event = ctx.Event()
		self._process = ctx.Process(
			target=_process_entrypoint,
			args=(self.redis_url, self.queue_key, self._stop_event),
			name="traffic-history-worker",
		)
		self._process.start()

	async def stop(self):
		if self._process is None:
			return

		if self._stop_event is not None:
			self._stop_event.set()

		await asyncio.to_thread(self._process.join, 5)
		if self._process.is_alive():
			self._process.terminate()
			await asyncio.to_thread(self._process.join, 2)

		self._process = None
		self._stop_event = None
