import logging
import os
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Optional


_IS_CONFIGURED = False


def setup_logging(level: Optional[str] = None) -> None:
	"""Configure application-wide logging once.

	The format includes process name to help debug multiprocessing traffic workers.
	"""
	global _IS_CONFIGURED

	if _IS_CONFIGURED:
		return

	log_level = (level or os.getenv("LOG_LEVEL", "INFO")).upper()
	logs_dir = Path(__file__).resolve().parent.parent / "logs"
	logs_dir.mkdir(parents=True, exist_ok=True)

	log_file = logs_dir / os.getenv("LOG_FILE_NAME", "app.log")
	max_bytes = int(os.getenv("LOG_FILE_MAX_BYTES", "5242880"))
	backup_count = int(os.getenv("LOG_FILE_BACKUP_COUNT", "5"))
	log_to_console = os.getenv("LOG_TO_CONSOLE", "false").lower() in {"1", "true", "yes", "on"}

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
	sql_echo_enabled = os.getenv("SQL_ECHO", "false").lower() in {"1", "true", "yes", "on"}
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
