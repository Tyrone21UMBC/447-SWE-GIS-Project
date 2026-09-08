from fastapi import FastAPI
from pydantic import BaseModel, EmailStr

app = FastAPI()


class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str


# Health Checkpoint
@app.get("/")
async def read_root():
    return {"status": "Healthy"}

# Create a user
@app.get("/users")
def create_user(user: UserCreate):
    hashed_password = hash_password(user.password)
    
    db_user = User(
            username=user.username,
            email=user.email,
            hashed_password=hashed_password
            )


