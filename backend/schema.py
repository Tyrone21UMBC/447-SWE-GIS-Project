from pydantic import BaseModel, EmailStr, Field, field_validator

class UserCreate(BaseModel):
    username: str
    email: EmailStr = Field(pattern=r".+@umbc\.edu")
    password: str
    


class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr = Field(pattern=r".+@umbc\.edu")

class UserLogin(BaseModel):
    email: EmailStr  = Field(pattern=r".+@umbc\.edu")
    password: str

class FormSubmit(BaseModel):
    user_id: int
    title: str
    location: str
    description: str
