from fastapi import FastAPI, Depends
from security import hash_password
from models import User
from schema import UserCreate
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

@app.get("/users")
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()




