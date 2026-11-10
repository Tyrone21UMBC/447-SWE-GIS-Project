import base64
import binascii
import json
import os
import urllib.error
import urllib.request

from fastapi import FastAPI, Depends, HTTPException
from security import hash_password, verify_password
from models import User
from schema import UserCreate, UserResponse, UserLogin, ReportUpload
from database import get_db, engine, Base
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


Base.metadata.create_all(bind=engine)

# Google Apps Script web app that saves reports into the shared Drive folder
APPS_SCRIPT_URL = os.getenv("APPS_SCRIPT_URL")
APPS_SCRIPT_SECRET = os.getenv("APPS_SCRIPT_SECRET")


# Health Checkpoint
@app.get("/")
async def read_root():
    return {"status": "Healthy"}

# Create a user
@app.post("/users")
def create_user(user: UserCreate, db: Session = Depends(get_db)):
    hashed_password = hash_password(user.password)
    
    new_user = User(
            username=user.username,
            email=user.email,
            hashed_password=hashed_password
            )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {
        "message": "User created successfully!",
        "user_id": new_user.id,
        "username": new_user.username
    }

# View users
@app.get("/users", response_model=list[UserResponse])
def get_users(db: Session = Depends(get_db)):
    return db.query(User).all()

# Log In verification
@app.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    
    db_user = db.query(User).filter(User.email == user.email).first()

    if not db_user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )
    if not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
                status_code=401,
                detail="Invalid email or password"
        )
    return {
            "message": "Login successfull!",
            "user_id": db_user.id,
            "username": db_user.username
    }

# Save a submitted report PDF to Google Drive
@app.post("/reports")
def upload_report(report: ReportUpload):
    if not APPS_SCRIPT_URL or not APPS_SCRIPT_SECRET:
        raise HTTPException(status_code=500, detail="Report upload is not configured")

    try:
        pdf = base64.b64decode(report.pdf, validate=True)
    except binascii.Error:
        raise HTTPException(status_code=400, detail="Invalid PDF data")
    if not pdf.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="File is not a PDF")

    # The secret stays here on the server; the browser never sees it
    body = json.dumps({"secret": APPS_SCRIPT_SECRET, "filename": report.filename, "pdf": report.pdf})
    request = urllib.request.Request(APPS_SCRIPT_URL, body.encode(), {"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(request, timeout=60) as res:
            result = json.loads(res.read())
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError):
        raise HTTPException(status_code=502, detail="Could not reach Google Drive")

    if not result.get("ok"):
        raise HTTPException(status_code=502, detail="Google Drive rejected the report")
    return {"message": "Report saved", "drive_file_id": result["id"], "drive_url": result["url"]}
