from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from sqlalchemy.orm import Session

from database import get_db
from models import User, LoginSession
import hashlib, secrets
from datetime import datetime, timedelta, timezone



# Pulls the token out of the "Authorization: Bearer <token>" header.
# The token is an opaque random string; the server looks it up, it never decodes it.
oauth2_scheme = OAuth2PasswordBearer(
        tokenUrl="/login"
        )

def get_current_user(
        token: str = Depends(oauth2_scheme),
        db: Session = Depends(get_db)
        ) -> User:
    credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
    )

    token_hash = hash_token(token)
    curr_session = db.query(LoginSession).filter(LoginSession.token_hash == token_hash).first()
 
    if curr_session is None:
        raise credentials_exception
    if curr_session.expires_at <= datetime.now(timezone.utc):
        db.delete(curr_session)
        db.commit()
        raise credentials_exception
    user = db.get(User, curr_session.user_id)
    if user is None:
        raise credentials_exception

    return user

def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()

def create_session(db, user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    db.add(LoginSession(token_hash=hash_token(token), user_id=user_id, expires_at=datetime.now(timezone.utc) + timedelta(hours=5)))
    db.commit()
    return token


