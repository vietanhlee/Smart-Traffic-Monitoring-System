from pydantic import BaseModel, Field
from typing import List

class ChatResponse(BaseModel):
    message: str = Field(..., description="Phản hồi của Agent dưới dạng văn bản (không gồm link của hình ảnh)")
    image: List[str] = Field(default_factory=list, description="Danh sách URL hình ảnh")
