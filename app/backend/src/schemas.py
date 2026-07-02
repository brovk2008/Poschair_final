from pydantic import BaseModel
from datetime import datetime
from typing import List, Dict, Any, Optional

# Calibration Schemas
class CalibrationBase(BaseModel):
    shoulder_tilt_baseline: float
    forward_head_baseline: float
    spine_angle_baseline: float
    neck_angle_baseline: float
    shoulder_tilt_correct: float
    forward_head_correct: float
    spine_angle_correct: float
    neck_angle_correct: float

class CalibrationCreate(CalibrationBase):
    pass

class CalibrationOut(CalibrationBase):
    id: int
    user_id: int
    updated_at: datetime

    class Config:
        from_attributes = True

# User Schemas
class UserBase(BaseModel):
    username: str
    height_cm: Optional[float] = None
    chair_type: Optional[str] = "Standard Office"
    support_level: Optional[str] = "Medium"

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    height_cm: Optional[float] = None
    chair_type: Optional[str] = None
    support_level: Optional[str] = None

class UserOut(UserBase):
    id: int
    created_at: datetime
    calibration: Optional[CalibrationOut] = None

    class Config:
        from_attributes = True

# Session Schemas
class PostureSessionBase(BaseModel):
    start_time: datetime
    end_time: datetime
    duration_seconds: int
    good_posture_seconds: int
    bad_posture_seconds: int
    slouch_count: int
    forward_head_count: int
    lean_left_right_count: int
    history_json: List[Dict[str, Any]] = []

class PostureSessionCreate(PostureSessionBase):
    pass

class PostureSessionOut(PostureSessionBase):
    id: int
    user_id: int

    class Config:
        from_attributes = True
