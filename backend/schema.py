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

class ReportUpload(BaseModel):
    filename: str = Field(pattern=r"^[\w.\-]{1,120}\.pdf$")
    pdf: str = Field(max_length=14_000_000)   # base64, ~10 MB PDF
