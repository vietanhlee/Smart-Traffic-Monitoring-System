"""create traffic_histories table

Revision ID: traffic_histories_002
Revises: chat_messages_001
Create Date: 2026-04-04

"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "traffic_histories_002"
down_revision = "chat_messages_001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "traffic_histories",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("road_name", sa.String(length=128), nullable=False),
        sa.Column("recorded_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("avg_count_car", sa.Integer(), nullable=False),
        sa.Column("avg_count_motor", sa.Integer(), nullable=False),
        sa.Column("avg_speed_car", sa.Float(), nullable=False),
        sa.Column("avg_speed_motor", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index("ix_traffic_histories_id", "traffic_histories", ["id"])
    op.create_index("ix_traffic_histories_road_name", "traffic_histories", ["road_name"])
    op.create_index("ix_traffic_histories_recorded_at", "traffic_histories", ["recorded_at"])
    op.create_index("ix_traffic_histories_created_at", "traffic_histories", ["created_at"])
    op.create_index(
        "ix_traffic_histories_road_name_recorded_at",
        "traffic_histories",
        ["road_name", "recorded_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_traffic_histories_road_name_recorded_at", table_name="traffic_histories")
    op.drop_index("ix_traffic_histories_created_at", table_name="traffic_histories")
    op.drop_index("ix_traffic_histories_recorded_at", table_name="traffic_histories")
    op.drop_index("ix_traffic_histories_road_name", table_name="traffic_histories")
    op.drop_index("ix_traffic_histories_id", table_name="traffic_histories")
    op.drop_table("traffic_histories")
