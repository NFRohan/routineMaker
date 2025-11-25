from pydantic import BaseModel
from typing import List, Optional

class ClassSessionBase(BaseModel):
    day: str
    start_time: str
    duration: int
    subject: str
    location: Optional[str] = None
    is_cancelled: bool = False

class ClassSessionCreate(ClassSessionBase):
    pass

class ClassSession(ClassSessionBase):
    id: int
    routine_id: str

    class Config:
        from_attributes = True

class RoutineBase(BaseModel):
    name: str
    weekends: Optional[str] = "Saturday,Sunday"
    start_time: Optional[str] = "08:00"
    end_time: Optional[str] = "17:00"
    class_duration: Optional[int] = 75
    lunch_start: Optional[str] = "13:00"
    lunch_duration: Optional[int] = 90

class RoutineCreate(RoutineBase):
    pass

class RoutineUpdate(BaseModel):
    weekends: str
    start_time: str
    end_time: str
    class_duration: int
    lunch_start: str
    lunch_duration: int

class Routine(RoutineBase):
    id: str
    creator_token: str
    owner_username: Optional[str] = None
    sessions: List[ClassSession] = []

    class Config:
        from_attributes = True
