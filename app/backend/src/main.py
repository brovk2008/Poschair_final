from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from .database import engine, Base, get_db
from . import models, schemas

# Initialize database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="PosChair API", description="AI Posture-Correcting Chair Attachment API Backend")

# Enable CORS for frontend and Web Bluetooth browser client accessibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In development, allow all origins. Can restrict to Vite port (5173) in production.
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Helper function to get or create the default user
def get_default_user(db: Session) -> models.User:
    user = db.query(models.User).filter(models.User.username == "default_user").first()
    if not user:
        user = models.User(username="default_user", height_cm=175.0, chair_type="Ergonomic", support_level="Medium")
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

@app.get("/")
def read_root():
    return {"status": "online", "message": "Welcome to the PosChair Posture Analyzer API"}

@app.get("/profile", response_model=schemas.UserOut)
def get_profile(db: Session = Depends(get_db)):
    user = get_default_user(db)
    return user

@post_profile_route := app.post("/profile", response_model=schemas.UserOut)
def update_profile(profile_data: schemas.UserUpdate, db: Session = Depends(get_db)):
    user = get_default_user(db)
    if profile_data.height_cm is not None:
        user.height_cm = profile_data.height_cm
    if profile_data.chair_type is not None:
        user.chair_type = profile_data.chair_type
    if profile_data.support_level is not None:
        user.support_level = profile_data.support_level
    db.commit()
    db.refresh(user)
    return user

@app.get("/calibration", response_model=schemas.CalibrationOut)
def get_calibration(db: Session = Depends(get_db)):
    user = get_default_user(db)
    if not user.calibration:
        # Create empty calibration with defaults
        calibration = models.Calibration(
            user_id=user.id,
            shoulder_tilt_baseline=0.0, forward_head_baseline=0.0, spine_angle_baseline=0.0, neck_angle_baseline=0.0,
            shoulder_tilt_correct=0.0, forward_head_correct=0.0, spine_angle_correct=0.0, neck_angle_correct=0.0
        )
        db.add(calibration)
        db.commit()
        db.refresh(user)
    return user.calibration

@app.post("/calibration", response_model=schemas.CalibrationOut)
def save_calibration(cal_data: schemas.CalibrationCreate, db: Session = Depends(get_db)):
    user = get_default_user(db)
    calibration = db.query(models.Calibration).filter(models.Calibration.user_id == user.id).first()
    
    if not calibration:
        calibration = models.Calibration(user_id=user.id)
        db.add(calibration)
        
    for key, value in cal_data.model_dump().items():
        setattr(calibration, key, value)
        
    calibration.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(calibration)
    return calibration

@app.post("/sessions", response_model=schemas.PostureSessionOut)
def create_session(session_data: schemas.PostureSessionCreate, db: Session = Depends(get_db)):
    user = get_default_user(db)
    new_session = models.PostureSession(
        user_id=user.id,
        start_time=session_data.start_time,
        end_time=session_data.end_time,
        duration_seconds=session_data.duration_seconds,
        good_posture_seconds=session_data.good_posture_seconds,
        bad_posture_seconds=session_data.bad_posture_seconds,
        slouch_count=session_data.slouch_count,
        forward_head_count=session_data.forward_head_count,
        lean_left_right_count=session_data.lean_left_right_count,
        history_json=session_data.history_json
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

@app.get("/sessions", response_model=List[schemas.PostureSessionOut])
def get_sessions(limit: int = 20, db: Session = Depends(get_db)):
    user = get_default_user(db)
    sessions = db.query(models.PostureSession)\
                 .filter(models.PostureSession.user_id == user.id)\
                 .order_by(models.PostureSession.start_time.desc())\
                 .limit(limit)\
                 .all()
    return sessions
