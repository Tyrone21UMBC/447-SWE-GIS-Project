from sqlalchemy import Column, Integer, String, Enum
from database import Base
from roles import UserRoles

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



