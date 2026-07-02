from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import PostureSession
from ..schemas import SessionCreate, SessionOut
from datetime import datetime

router = APIRouter()

@router.post("/", response_model=SessionOut)
def log_session(body: SessionCreate, db: Session = Depends(get_db)):
    s = PostureSession(**body.dict(), ended_at=datetime.utcnow())
    db.add(s); db.commit(); db.refresh(s); return s

@router.get("/{user_id}", response_model=List[SessionOut])
def get_sessions(user_id: int, db: Session = Depends(get_db)):
    return db.query(PostureSession).filter(
        PostureSession.user_id == user_id
    ).order_by(PostureSession.started_at.desc()).limit(30).all()
