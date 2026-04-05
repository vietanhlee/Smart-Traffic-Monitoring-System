from fastapi import Depends, HTTPException, status

from api import v1
from db.base import AsyncSession, get_db


def get_traffic_runtime():
    analyzer = v1.state.analyzer
    if analyzer is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Traffic service is unavailable because Redis is not connected.",
        )
    return analyzer


def get_db_session(db: AsyncSession = Depends(get_db)) -> AsyncSession:
    return db
