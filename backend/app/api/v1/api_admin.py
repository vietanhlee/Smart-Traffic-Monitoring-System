from fastapi import APIRouter, Depends, HTTPException, status
from utils.jwt_handler import get_current_user
from models.user import User
from utils.system_metrics import get_system_metrics


router = APIRouter(prefix="/admin")


@router.get("/resources")
async def get_resources(current_user: User = Depends(get_current_user)):
    """Return basic system metrics. Admin only (role_id = 0)."""
    if current_user.role_id != 0:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Chỉ admin mới được phép truy cập tài nguyên hệ thống.",
        )
    return get_system_metrics()
