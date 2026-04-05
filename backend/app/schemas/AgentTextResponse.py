from pydantic import BaseModel, Field


class AgentTextResponse(BaseModel):
    message: str = Field(..., description="Phản hồi của agent dưới dạng văn bản")