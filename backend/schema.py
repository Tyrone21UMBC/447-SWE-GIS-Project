from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import datetime
from roles import UserRoles
from statuses import WorkOrderStatus

class UserCreate(BaseModel):
    username: str
    email: EmailStr = Field(pattern=r".+@umbc\.edu")
    password: str
    


class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr = Field(pattern=r".+@umbc\.edu")
    role: UserRoles

class RoleUpdate(BaseModel):
    role: UserRoles

    # Accept any casing ("staff", "STAFF"): the enum's values aren't consistently cased
    @field_validator("role", mode="before")
    @classmethod
    def by_name(cls, value):
        return UserRoles[value.upper()] if isinstance(value, str) and value.upper() in UserRoles.__members__ else value

class UserLogin(BaseModel):
    email: EmailStr  = Field(pattern=r".+@umbc\.edu")
    password: str

class FormSubmit(BaseModel):
    user_id: int
    title: str
    location: str
    description: str
    date_created: datetime

class ReportUpload(BaseModel):
    filename: str = Field(pattern=r"^[\w.\-]{1,120}\.pdf$")
    pdf: str = Field(max_length=14_000_000)   # base64, ~10 MB PDF
    bmp_id: str | None = Field(default=None, max_length=40)
    bmp_name: str | None = Field(default=None, max_length=200)

class WorkOrderResponse(BaseModel):
    id: int
    bmp_id: str | None
    bmp_name: str | None
    filename: str
    drive_url: str
    status: WorkOrderStatus
    submitted_by: str | None    # username
    created_at: datetime
    updated_at: datetime

class StatusUpdate(BaseModel):
    status: WorkOrderStatus

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    role: UserRoles



