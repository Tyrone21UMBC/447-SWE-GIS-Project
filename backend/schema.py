from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import date, datetime
from roles import UserRoles
from statuses import WorkOrderStatus

class UserCreate(BaseModel):
    username: str
    email: EmailStr = Field(pattern=r".+@umbc\.edu")
    password: str
    


class UserResponse(BaseModel):
    id: int
    username: str
    # No @umbc.edu check here: that rule is for new sign-ups, and older accounts may not follow it
    email: str
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

# Campus and a margin around it; a point outside is almost certainly a typo
CAMPUS_LAT = (39.24, 39.27)
CAMPUS_LON = (-76.73, -76.69)

class BmpCreate(BaseModel):
    tracking_number: str = Field(pattern=r"^\d{2}-[A-Z]{2}-\d{4}-\d{1,2}[A-Z]?$")
    name: str = Field(min_length=1, max_length=200)
    facility_type: str = Field(min_length=1, max_length=100)
    sf_number: str | None = Field(default=None, pattern=r"^\d{2}-[A-Z]{2}-\d{4}$")
    outfall_point: str | None = Field(default=None, max_length=20)
    drainage_area: str | None = Field(default=None, max_length=20)
    in_service: date | None = None
    lat: float = Field(ge=CAMPUS_LAT[0], le=CAMPUS_LAT[1])
    lon: float = Field(ge=CAMPUS_LON[0], le=CAMPUS_LON[1])

    # Trim, upper-case the IDs, and turn blank optional fields into None
    @field_validator("tracking_number", "sf_number", mode="before")
    @classmethod
    def normalize_id(cls, value):
        return (value.strip().upper() or None) if isinstance(value, str) else value

    @field_validator("name", "facility_type", "outfall_point", "drainage_area", mode="before")
    @classmethod
    def strip(cls, value):
        return (value.strip() or None) if isinstance(value, str) else value

class BmpResponse(BaseModel):
    id: int
    tracking_number: str
    name: str
    facility_type: str
    sf_number: str | None
    outfall_point: str | None
    drainage_area: str | None
    in_service: date | None
    lat: float
    lon: float
    created_by: str | None    # username
    created_at: datetime
