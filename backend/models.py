from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base
import uuid

class Routine(Base):
    __tablename__ = "routines"

    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, index=True)
    creator_token = Column(String, default=lambda: str(uuid.uuid4()))
    owner_username = Column(String, index=True, nullable=True)
    weekends = Column(String, default="Saturday,Sunday")
    
    # Schedule Settings
    start_time = Column(String, default="08:00")
    end_time = Column(String, default="17:00")
    class_duration = Column(Integer, default=75)
    lunch_start = Column(String, default="13:00")
    lunch_duration = Column(Integer, default=90)

    sessions = relationship("ClassSession", back_populates="routine")

class ClassSession(Base):
    __tablename__ = "class_sessions"

    id = Column(Integer, primary_key=True, index=True)
    routine_id = Column(String, ForeignKey("routines.id"))
    day = Column(String) # Monday, Tuesday, etc.
    start_time = Column(String) # "08:00"
    duration = Column(Integer) # 75 or 150
    subject = Column(String)
    location = Column(String, nullable=True)
    is_cancelled = Column(Boolean, default=False)

    routine = relationship("Routine", back_populates="sessions")
