from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import Column, Integer, String






class Base(DeclarativeBase):
    pass

class User(Base):
    __table__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String)
    email = Column(String)
