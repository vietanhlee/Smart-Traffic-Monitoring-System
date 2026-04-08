import logging
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Optional

from core.config import settings_server


_IS_CONFIGURED = False


def setup_logging(level: Optional[str] = None) -> None:
	"""Configure application-wide logging once.

	The format includes process name to help debug multiprocessing traffic workers.
	"""
	global _IS_CONFIGURED

	if _IS_CONFIGURED:
		return

	log_level = (level or settings_server.LOG_LEVEL).upper()
	logs_dir = Path(__file__).resolve().parent.parent / "logs"
	logs_dir.mkdir(parents=True, exist_ok=True)

	log_file = logs_dir / settings_server.LOG_FILE_NAME
	max_bytes = settings_server.LOG_FILE_MAX_BYTES
	backup_count = settings_server.LOG_FILE_BACKUP_COUNT
	log_to_console = settings_server.LOG_TO_CONSOLE

	formatter = logging.Formatter(
		"%(asctime)s | %(levelname)s | %(processName)s | %(name)s | %(message)s"
	)

	stream_handler = logging.StreamHandler()
	stream_handler.setFormatter(formatter)

	file_handler = RotatingFileHandler(
		filename=log_file,
		maxBytes=max_bytes,
		backupCount=backup_count,
		encoding="utf-8",
	)
	file_handler.setFormatter(formatter)

	root_logger = logging.getLogger()
	root_logger.setLevel(log_level)
	root_logger.handlers.clear()
	if log_to_console:
		root_logger.addHandler(stream_handler)
	root_logger.addHandler(file_handler)

	# SQLAlchemy logs: ghi vào file log, không in ra console
	sql_echo_enabled = settings_server.SQL_ECHO
	sql_log_level = logging.INFO if sql_echo_enabled else logging.WARNING
	for logger_name in ("sqlalchemy", "sqlalchemy.engine", "sqlalchemy.engine.Engine", "sqlalchemy.pool"):
		sql_logger = logging.getLogger(logger_name)
		sql_logger.setLevel(sql_log_level)
		sql_logger.handlers.clear()
		sql_logger.addHandler(file_handler)
		sql_logger.propagate = False

	# Dọn các logger con sqlalchemy đã được tạo trước đó (ví dụ do engine init sớm) để tránh in ra console.
	for name in list(logging.root.manager.loggerDict.keys()):
		if not name.startswith("sqlalchemy"):
			continue
		logger_obj = logging.getLogger(name)
		logger_obj.setLevel(sql_log_level)
		logger_obj.handlers.clear()
		logger_obj.addHandler(file_handler)
		logger_obj.propagate = False

	_IS_CONFIGURED = True


def get_logger(name: str) -> logging.Logger:
	return logging.getLogger(name)


def get_named_rotating_file_logger(
	name: str,
	filename: str,
	*,
	level: Optional[str] = None,
	max_bytes: Optional[int] = None,
	backup_count: Optional[int] = None,
) -> logging.Logger:
	"""Return a dedicated rotating-file logger for a specific module.

	This logger is isolated from root handlers (propagate=False) to avoid duplicate logs.
	"""
	logger = logging.getLogger(name)
	if logger.handlers:
		return logger

	logs_dir = Path(__file__).resolve().parent.parent / "logs"
	logs_dir.mkdir(parents=True, exist_ok=True)

	resolved_level = (level or settings_server.LOG_LEVEL).upper()
	resolved_max_bytes = max_bytes or settings_server.LOG_FILE_MAX_BYTES
	resolved_backup_count = backup_count or settings_server.LOG_FILE_BACKUP_COUNT

	handler = RotatingFileHandler(
		filename=logs_dir / filename,
		maxBytes=resolved_max_bytes,
		backupCount=resolved_backup_count,
		encoding="utf-8",
	)
	handler.setFormatter(
		logging.Formatter("%(asctime)s | %(levelname)s | %(name)s | %(message)s")
	)

	logger.setLevel(resolved_level)
	logger.addHandler(handler)
	logger.propagate = False
	return logger
