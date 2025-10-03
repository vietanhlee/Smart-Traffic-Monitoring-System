from pydantic import BaseModel
from typing import Optional, Annotated

class ChatResponse(BaseModel):
    message: Annotated[str, "Phản hồi từ ChatBotAgent"]
    image: Optional[str] = None 
