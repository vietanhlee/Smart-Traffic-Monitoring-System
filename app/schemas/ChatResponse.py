from pydantic import BaseModel
from typing import Optional

class ChatResponse(BaseModel):
    message: str
    image: Optional[str] = None  # Base64 encoded image
