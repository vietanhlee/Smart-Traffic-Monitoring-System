from app.models.TokenLLM import TokenLLM


def test_tokenllm_has_primary_key():
    # Ensure SQLAlchemy mapped table has a primary key configured
    pk_cols = list(TokenLLM.__table__.primary_key.columns)
    assert len(pk_cols) == 1
    assert pk_cols[0].name == "user_id"
