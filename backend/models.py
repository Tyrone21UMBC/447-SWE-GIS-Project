from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, DateTime, Float, Date 
from sqlalchemy.orm import relationship
from database import Base
from roles import UserRoles
from statuses import WorkOrderStatus

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String, nullable=False)
    email = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRoles),
                  default=UserRoles.VISITOR,
                  nullable=False
                )

class Form(Base):
    __tablename__ = "forms"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, nullable=False)
    title = Column(String, nullable=False)
    location = Column(String, nullable=False)
    description = Column(String, nullable=False)
    date_created = Column(DateTime(timezone=True), nullable=False)


class LoginSession(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True)
    token_hash = Column(String, unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"))
    expires_at = Column(DateTime(timezone=True), nullable=False)


# One per submitted inspection report; the PDF itself lives in Google Drive
class WorkOrder(Base):
    __tablename__ = "work_orders"

    id = Column(Integer, primary_key=True)
    bmp_id = Column(String)                 # SWM Tracking Number; none if no BMP was selected
    bmp_name = Column(String)
    filename = Column(String, nullable=False)
    drive_url = Column(String, nullable=False)
    status = Column(Enum(WorkOrderStatus),
                    default=WorkOrderStatus.PENDING,
                    nullable=False
                )
    submitted_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    submitter = relationship(User)


# BMPs added by an admin in the app. The rest come from UMBC's SWM Tracking
# geodatabase (frontend/src/data/bmps.json); if both have an ID, the geodatabase wins.
class Bmp(Base):
    __tablename__ = "bmps"

    id = Column(Integer, primary_key=True)
    tracking_number = Column(String, unique=True, nullable=False, index=True)   # SWM Tracking Number
    name = Column(String, nullable=False)
    facility_type = Column(String, nullable=False)
    sf_number = Column(String)
    outfall_point = Column(String)
    drainage_area = Column(String)
    in_service = Column(Date)               # date placed into service
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"))
    created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))

    creator = relationship(User)
