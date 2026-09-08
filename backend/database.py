import os
from dotenv import load_dotenv
from sqlalchemy.orm import DeclarativeBase, sessionmaker
from sqlalchemy import create_engine

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL is None:
    raise ValueError("Database URL not found")

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
        bind=engine,
        autocommit=False,
        autoflush=False
        )

class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

