from services.road_services.AnalyzeOnRoadForMultiProcessing import AnalyzeOnRoadForMultiprocessing
from services.chat_services.ChatBotAgent import ChatBotAgent


MAX_PRIVATE_IMAGES_PER_THREAD = 4
_chat_private_images: dict[str, list[str]] = {}


def _normalize_thread_id(thread_id: str | int | None) -> str:
    if thread_id is None:
        return "anonymous"
    return str(thread_id)


def clear_private_images(thread_id: str | int | None) -> None:
    key = _normalize_thread_id(thread_id)
    _chat_private_images.pop(key, None)


def append_private_image(thread_id: str | int | None, image_base64: str) -> None:
    key = _normalize_thread_id(thread_id)
    images = _chat_private_images.setdefault(key, [])
    images.append(image_base64)
    if len(images) > MAX_PRIVATE_IMAGES_PER_THREAD:
        del images[:-MAX_PRIVATE_IMAGES_PER_THREAD]


def pop_private_images(thread_id: str | int | None) -> list[str]:
    key = _normalize_thread_id(thread_id)
    return _chat_private_images.pop(key, [])

# Phần gắn tạm để gợi ý code
# analyzer = AnalyzeOnRoadForMultiprocessing(show= False,
#                                            show_log= False,
#                                            is_join_processes= False)
# agent = ChatBotAgent()


# Phần states chính thức
analyzer = None
# chat_bot = None
agent = None
traffic_history_worker = None

