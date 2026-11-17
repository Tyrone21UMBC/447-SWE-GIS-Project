from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import get_current_user
from database import get_db
from models import User
from schema import RoleUpdate, UserResponse
from security import require_admin

router = APIRouter(
    prefix="/users",
    tags=["Users"]
)


@router.get("/me")
def get_me(
    current_user: User = Depends(get_current_user)
):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role
    }


# Change another user's role
@router.patch("/{user_id}/role", response_model=UserResponse)
def set_role(
    user_id: int,
    update: RoleUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    # Otherwise the last admin could lock everyone out of the dashboard
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="You can't change your own role")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = update.role
    db.commit()
    db.refresh(user)
    return user
