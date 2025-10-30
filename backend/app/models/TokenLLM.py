from sqlalchemy import Column, ForeignKey, Integer
from db.base import Base


class TokenLLM(Base):
    __tablename__ = "token_llm"

    # Use user_id as the primary key and FK to users.id to ensure
    # a 1-1 relationship between a user and their LLM token quota
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True, index=True)
    token = Column(Integer, nullable=False, default=5000)
