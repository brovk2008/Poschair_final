from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, default="default_user")
    height_cm = Column(Float, nullable=True)
    chair_type = Column(String, default="Standard Office")
    support_level = Column(String, default="Medium") // Low, Medium, High
    created_at = Column(DateTime, default=datetime.utcnow)

    calibration = relationship("Calibration", back_populates="user", uselist=False, cascade="all, delete-orphan")
    sessions = relationship("PostureSession", back_populates="user", cascade="all, delete-orphan")

class Calibration(Base):
    __tablename__ = "calibrations"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    
    # Baseline posture angles (slouching/natural state)
    shoulder_tilt_baseline = Column(Float, default=0.0)
    forward_head_baseline = Column(Float, default=0.0)
    spine_angle_baseline = Column(Float, default=0.0)
    neck_angle_baseline = Column(Float, default=0.0)

    # Correct/perfect posture angles (target/aligned state)
    shoulder_tilt_correct = Column(Float, default=0.0)
    forward_head_correct = Column(Float, default=0.0)
    spine_angle_correct = Column(Float, default=0.0)
    neck_angle_correct = Column(Float, default=0.0)
    
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="calibration")

class PostureSession(Base):
    __tablename__ = "posture_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, default=datetime.utcnow)
    
    duration_seconds = Column(Integer, default=0)
    good_posture_seconds = Column(Integer, default=0)
    bad_posture_seconds = Column(Integer, default=0)
    
    # Detailed counts of specific posture failure states
    slouch_count = Column(Integer, default=0)
    forward_head_count = Column(Integer, default=0)
    lean_left_right_count = Column(Integer, default=0)
    
    # Raw history list for plotting over time [{time: timestamp, score: 0-100}]
    history_json = Column(JSON, default=list)

    user = relationship("User", back_populates="sessions")
