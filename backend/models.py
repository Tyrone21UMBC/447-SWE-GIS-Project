from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Enum, ForeignKey, DateTime 
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
