"""add composite index for chat_messages pagination

Revision ID: chat_messages_003
Revises: traffic_histories_002
Create Date: 2026-04-05

"""

from alembic import op


# revision identifiers, used by Alembic.
revision = "chat_messages_003"
down_revision = "traffic_histories_002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index(
        "ix_chat_messages_user_created_at",
        "chat_messages",
        ["user_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_chat_messages_user_created_at", table_name="chat_messages")
