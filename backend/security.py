from pwdlib import PasswordHash
from fastapi import Depends, HTTPException, status
from models import User
from auth import get_current_user
from roles import UserRoles


password_hash = PasswordHash.recommended()

def hash_password(password: str) -> str:
    return password_hash.hash(password)

def verify_password(password: str, hashed_password: str) -> bool:
    return password_hash.verify(password, hashed_password)

def require_admin(
        current_user: User = Depends(get_current_user)
        ):
    if current_user.role != UserRoles.ADMIN:
        raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
                )
        return current User
