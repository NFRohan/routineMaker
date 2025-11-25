from sqlalchemy.orm import Session
import models, schemas

def get_routine(db: Session, routine_id: str):
    return db.query(models.Routine).filter(models.Routine.id == routine_id).first()

def get_user_routines(db: Session, username: str):
    return db.query(models.Routine).filter(models.Routine.owner_username == username).all()

def create_routine(db: Session, routine: schemas.RoutineCreate, owner_username: str = None):
    db_routine = models.Routine(name=routine.name, owner_username=owner_username)
    db.add(db_routine)
    db.commit()
    db.refresh(db_routine)
    return db_routine

def update_routine(db: Session, routine_id: str, routine_update: schemas.RoutineUpdate):
    db_routine = get_routine(db, routine_id)
    if db_routine:
        db_routine.weekends = routine_update.weekends
        db_routine.start_time = routine_update.start_time
        db_routine.end_time = routine_update.end_time
        db_routine.class_duration = routine_update.class_duration
        db_routine.lunch_start = routine_update.lunch_start
        db_routine.lunch_duration = routine_update.lunch_duration
        db.commit()
        db.refresh(db_routine)
    return db_routine

def create_routine_session(db: Session, session: schemas.ClassSessionCreate, routine_id: str):
    db_session = models.ClassSession(**session.dict(), routine_id=routine_id)
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return db_session

def update_session_cancellation(db: Session, session_id: int, is_cancelled: bool):
    db_session = db.query(models.ClassSession).filter(models.ClassSession.id == session_id).first()
    if db_session:
        db_session.is_cancelled = is_cancelled
        db.commit()
        db.refresh(db_session)
    return db_session

def delete_session(db: Session, session_id: int):
    db_session = db.query(models.ClassSession).filter(models.ClassSession.id == session_id).first()
    if db_session:
        db.delete(db_session)
        db.commit()
    return db_session

def delete_routine(db: Session, routine_id: str):
    db_routine = get_routine(db, routine_id)
    if db_routine:
        # Delete all associated sessions first
        db.query(models.ClassSession).filter(models.ClassSession.routine_id == routine_id).delete()
        # Delete the routine
        db.delete(db_routine)
        db.commit()
    return db_routine
