import re
import json
from datetime import timedelta
from io import BytesIO
from threading import Lock
from urllib.parse import quote, urlparse, urlunparse
from uuid import uuid4

from minio import Minio

from core.config import settings_server
from core.logging_config import get_logger


logger = get_logger(__name__)
_SAFE_SLUG_PATTERN = re.compile(r"[^a-zA-Z0-9._-]+")


def _slugify(value: str) -> str:
    normalized = _SAFE_SLUG_PATTERN.sub("-", (value or "").strip()).strip("-")
    return normalized.lower() or "unknown-road"


class MinioImageStore:
    def __init__(self) -> None:
        self._bucket_name = settings_server.MINIO_BUCKET
        self._expiry_seconds = settings_server.MINIO_URL_EXPIRY_SECONDS
        self._url_mode = settings_server.MINIO_IMAGE_URL_MODE
        self._auto_set_public_read = settings_server.MINIO_AUTO_SET_PUBLIC_READ
        self._bucket_ready = False
        self._bucket_lock = Lock()
        self._client = Minio(
            endpoint=settings_server.MINIO_ENDPOINT,
            access_key=settings_server.MINIO_ACCESS_KEY,
            secret_key=settings_server.MINIO_SECRET_KEY,
            secure=settings_server.MINIO_SECURE,
        )

    def _ensure_bucket(self) -> None:
        if self._bucket_ready:
            return

        with self._bucket_lock:
            if self._bucket_ready:
                return

            if not self._client.bucket_exists(self._bucket_name):
                self._client.make_bucket(self._bucket_name)
                logger.info("Created MinIO bucket: %s", self._bucket_name)

            if self._auto_set_public_read:
                self._set_bucket_public_read_policy()

            self._bucket_ready = True

    def _set_bucket_public_read_policy(self) -> None:
        policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"AWS": ["*"]},
                    "Action": ["s3:GetObject"],
                    "Resource": [f"arn:aws:s3:::{self._bucket_name}/*"],
                }
            ],
        }
        self._client.set_bucket_policy(self._bucket_name, json.dumps(policy))
        logger.info("Applied public-read policy for bucket: %s", self._bucket_name)

    @staticmethod
    def _rewrite_public_url(url: str) -> str:
        public_endpoint = (settings_server.MINIO_PUBLIC_ENDPOINT or "").strip()
        if not public_endpoint:
            return url

        parsed = urlparse(url)

        if public_endpoint.startswith(("http://", "https://")):
            endpoint_parsed = urlparse(public_endpoint)
            scheme = endpoint_parsed.scheme or parsed.scheme
            netloc = endpoint_parsed.netloc or endpoint_parsed.path
        else:
            scheme = settings_server.MINIO_PUBLIC_SCHEME or parsed.scheme
            netloc = public_endpoint

        if not netloc:
            return url

        return urlunparse(
            (
                scheme,
                netloc,
                parsed.path,
                parsed.params,
                parsed.query,
                parsed.fragment,
            )
        )

    def _build_public_object_url(self, object_name: str) -> str:
        public_endpoint = (settings_server.MINIO_PUBLIC_ENDPOINT or "").strip()
        if not public_endpoint:
            public_endpoint = settings_server.MINIO_ENDPOINT

        if public_endpoint.startswith(("http://", "https://")):
            parsed = urlparse(public_endpoint)
            scheme = parsed.scheme or settings_server.MINIO_PUBLIC_SCHEME
            netloc = parsed.netloc or parsed.path
        else:
            scheme = settings_server.MINIO_PUBLIC_SCHEME
            netloc = public_endpoint

        object_path = quote(object_name, safe="/")
        return f"{scheme}://{netloc}/{self._bucket_name}/{object_path}"

    def upload_road_frame(self, road_name: str, frame_bytes: bytes) -> str:
        if not frame_bytes:
            raise ValueError("frame_bytes is empty")

        self._ensure_bucket()
        road_slug = _slugify(road_name)
        object_name = f"roads/{road_slug}/{uuid4().hex}.jpg"

        self._client.put_object(
            bucket_name=self._bucket_name,
            object_name=object_name,
            data=BytesIO(frame_bytes),
            length=len(frame_bytes),
            content_type="image/jpeg",
        )

        if self._url_mode == "public":
            return self._build_public_object_url(object_name)

        presigned_url = self._client.presigned_get_object(
            bucket_name=self._bucket_name,
            object_name=object_name,
            expires=timedelta(seconds=self._expiry_seconds),
        )

        return self._rewrite_public_url(presigned_url)


minio_image_store = MinioImageStore()
