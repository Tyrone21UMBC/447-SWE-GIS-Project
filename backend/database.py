from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy import create_engine, Column, Integer, String


engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
        bind=engine,
        autocommit=False,
        autoflush=False
        )

class Base(DeclarativeBase):
    pass

class User(Base):
    __table__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String)
    email = Column(String)
