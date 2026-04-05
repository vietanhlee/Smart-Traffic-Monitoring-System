from langchain_core.messages.utils import (
    trim_messages,
    count_tokens_approximately
)
from langchain.agents.middleware import AgentMiddleware


class TrimMessagesMiddleware(AgentMiddleware):
    """Middleware cắt lịch sử hội thoại trước mỗi lượt gọi model."""

    def __init__(self, max_tokens: int = 2000):
        self.max_tokens = max_tokens

    def before_model(self, state, runtime):
        messages = state.get("messages", [])
        trimmed_messages = trim_messages(
            messages,
            strategy="last",
            token_counter=count_tokens_approximately,
            max_tokens=self.max_tokens,
            start_on="human",
            end_on=("human", "tool"),
        )
        return {"llm_input_messages": trimmed_messages}
