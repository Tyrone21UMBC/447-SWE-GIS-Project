from fastapi import FastAPI, Depends, HTTPException
from security import hash_password, verify_password
from models import User
from schema import UserCreate, UserResponse, UserLogin
from database import get_db, engine, Base
from sqlalchemy.orm import Session

app = FastAPI()

Base.metadata.create_all(bind=engine)


# Health Checkpoint
@app.get("/")
async def read_root():
    return {"status": "Healthy"}

# Create a user
@app.post("/users")
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    hashed_password = hash_password(user.password)
    
    new_user = User(
            username=user.username,
            email=user.email,
            hashed_password=hashed_password
            )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {
        "message": "User created successfully!",
        "user_id": new_user.id,
        "username": new_user.username
    }

# View users
@app.get("/users", response_model=list[UserResponse])
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()

# Log In verification
@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    
    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )
    if not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
        )
    return {
            "message": "Login successfull!",
            "user_id": db_user.id,
            "username": db_user.username
    }
    



