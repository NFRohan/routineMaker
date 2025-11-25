from fastapi import FastAPI, Depends, HTTPException, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from typing import List, Optional
from jose import JWTError, jwt
import crud, models, schemas, database, pdf_utils

# Shared secret with Auth Service
SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
ALGORITHM = "HS256"

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="http://localhost:8001/login")

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    return username

@app.get("/routines/mine", response_model=List[schemas.Routine])
def read_user_routines(
    db: Session = Depends(get_db),
    current_user: str = Depends(get_current_user)
):
    return crud.get_user_routines(db=db, username=current_user)

@app.post("/routines/", response_model=schemas.Routine)
def create_routine(
    routine: schemas.RoutineCreate, 
    db: Session = Depends(get_db),
    current_user: Optional[str] = Depends(get_current_user) 
):
    # Allow anonymous creation if no token provided (handled by Optional dependency if we made it optional, 
    # but OAuth2PasswordBearer raises 401 if missing. 
    # To allow optional auth, we'd need a different approach or just enforce it.
    # For now, let's ENFORCE it for new routines as per user request to switch systems.
    # But wait, the frontend isn't updated yet. If I enforce it, the current frontend breaks.
    # I should probably make it optional for now or update frontend first.
    # The plan says "Update Frontend... Update Main Backend".
    # I'll make it optional by handling the dependency differently or just accepting that it breaks until frontend is done.
    # Actually, I can make the dependency optional by using `token: Optional[str] = Depends(oauth2_scheme)` but oauth2_scheme might be strict.
    # Let's try to make it strict and update frontend quickly.
    return crud.create_routine(db=db, routine=routine, owner_username=current_user)

@app.get("/routines/{routine_id}", response_model=schemas.Routine)
def read_routine(routine_id: str, db: Session = Depends(get_db)):
    db_routine = crud.get_routine(db, routine_id=routine_id)
    if db_routine is None:
        raise HTTPException(status_code=404, detail="Routine not found")
    return db_routine

@app.put("/routines/{routine_id}", response_model=schemas.Routine)
def update_routine(
    routine_id: str, 
    routine_update: schemas.RoutineUpdate, 
    token: Optional[str] = None, 
    db: Session = Depends(get_db),
    current_user: Optional[str] = Depends(get_current_user)
):
    db_routine = crud.get_routine(db, routine_id=routine_id)
    if not db_routine:
        raise HTTPException(status_code=404, detail="Routine not found")
    
    # Check ownership: either username matches or token matches
    is_owner = False
    if db_routine.owner_username and current_user and db_routine.owner_username == current_user:
        is_owner = True
    elif db_routine.creator_token == token:
        is_owner = True
        
    if not is_owner:
        raise HTTPException(status_code=403, detail="Not authorized to update this routine")
    
    return crud.update_routine(db=db, routine_id=routine_id, routine_update=routine_update)

@app.post("/routines/{routine_id}/sessions/", response_model=schemas.ClassSession)
def create_session_for_routine(
    routine_id: str, 
    session: schemas.ClassSessionCreate, 
    token: Optional[str] = None, 
    db: Session = Depends(get_db),
    current_user: Optional[str] = Depends(get_current_user)
):
    db_routine = crud.get_routine(db, routine_id=routine_id)
    if not db_routine:
        raise HTTPException(status_code=404, detail="Routine not found")
        
    is_owner = False
    if db_routine.owner_username and current_user and db_routine.owner_username == current_user:
        is_owner = True
    elif db_routine.creator_token == token:
        is_owner = True
        
    if not is_owner:
        raise HTTPException(status_code=403, detail="Not authorized to add sessions to this routine")
    
    return crud.create_routine_session(db=db, session=session, routine_id=routine_id)

@app.put("/sessions/{session_id}/cancel", response_model=schemas.ClassSession)
def cancel_session(
    session_id: int, 
    is_cancelled: bool, 
    token: Optional[str] = None, 
    db: Session = Depends(get_db),
    current_user: Optional[str] = Depends(get_current_user)
):
    # Need to verify token via routine lookup (omitted for brevity, but should be done properly)
    # For now, we'll just check if the session exists and assume the frontend sends the right token
    # In a real app, we'd check session.routine.creator_token == token
    
    db_session = db.query(models.ClassSession).filter(models.ClassSession.id == session_id).first()
    if not db_session:
         raise HTTPException(status_code=404, detail="Session not found")
    
    routine = db_session.routine
    is_owner = False
    if routine.owner_username and current_user and routine.owner_username == current_user:
        is_owner = True
    elif routine.creator_token == token:
        is_owner = True
        
    if not is_owner:
         raise HTTPException(status_code=403, detail="Not authorized")

    return crud.update_session_cancellation(db=db, session_id=session_id, is_cancelled=is_cancelled)

@app.delete("/sessions/{session_id}")
def delete_session(
    session_id: int, 
    token: Optional[str] = None, 
    db: Session = Depends(get_db),
    current_user: Optional[str] = Depends(get_current_user)
):
    db_session = db.query(models.ClassSession).filter(models.ClassSession.id == session_id).first()
    if not db_session:
         raise HTTPException(status_code=404, detail="Session not found")
    
    routine = db_session.routine
    is_owner = False
    if routine.owner_username and current_user and routine.owner_username == current_user:
        is_owner = True
    elif routine.creator_token == token:
        is_owner = True
        
    if not is_owner:
         raise HTTPException(status_code=403, detail="Not authorized")
         
    crud.delete_session(db=db, session_id=session_id)
    return {"ok": True}

@app.delete("/routines/{routine_id}")
def delete_routine(
    routine_id: str,
    token: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[str] = Depends(get_current_user)
):
    db_routine = crud.get_routine(db, routine_id=routine_id)
    if not db_routine:
        raise HTTPException(status_code=404, detail="Routine not found")
    
    # Check ownership: either username matches or token matches
    is_owner = False
    if db_routine.owner_username and current_user and db_routine.owner_username == current_user:
        is_owner = True
    elif db_routine.creator_token == token:
        is_owner = True
        
    if not is_owner:
        raise HTTPException(status_code=403, detail="Not authorized to delete this routine")
    
    crud.delete_routine(db=db, routine_id=routine_id)
    return {"ok": True}

@app.get("/routines/{routine_id}/export")
def export_routine_pdf(routine_id: str, db: Session = Depends(get_db)):
    db_routine = crud.get_routine(db, routine_id=routine_id)
    if not db_routine:
        raise HTTPException(status_code=404, detail="Routine not found")
    
    pdf_buffer = pdf_utils.generate_routine_pdf(db_routine)
    
    return Response(
        content=pdf_buffer.getvalue(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=routine_{routine_id}.pdf"}
    )

