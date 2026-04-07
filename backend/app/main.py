from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm

from app.database import engine, get_db
from app import models, schemas
from app.security import hash_password, verify_password
from app.auth import create_access_token
from app.dependencies import get_current_user

from fastapi.middleware.cors import CORSMiddleware
from fastapi import Form
from fastapi import Request



# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "Event Platform API Running"}


# ---------------- USER REGISTER ----------------

@app.post("/users", response_model=schemas.UserResponse)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db)):

    hashed_pwd = hash_password(user.password)

    db_user = models.User(
        username=user.username,
        password=hashed_pwd,
        role=user.role
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    return db_user


# ---------------- CURRENT USER --------------

from fastapi.security import OAuth2PasswordRequestForm

from fastapi import Request

@app.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):

    db_user = db.query(models.User).filter(
        models.User.username == form_data.username
    ).first()

    if db_user is None:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if not verify_password(form_data.password, db_user.password):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    access_token = create_access_token(
        data={"sub": db_user.username}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": db_user.role
    }
    # ---------------- GET CURRENT USER ----------------

@app.get("/users/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# ---------------- MY REGISTRATION ----------------

@app.get("/events/{event_id}/my-registration")
def get_my_registration(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    registration = db.query(models.Registration).filter(
        models.Registration.event_id == event_id,
        models.Registration.user_id == current_user.id
    ).first()

    return registration
# ---------------- CREATE EVENT ----------------

@app.post("/events", response_model=schemas.EventResponse)
def create_event(
    event: schemas.EventCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    db_event = models.Event(
        title=event.title,
        description=event.description,
        date=event.date,
        capacity=event.capacity,
        organizer_id=current_user.id
    )

    db.add(db_event)
    db.commit()
    db.refresh(db_event)

    return db_event


# ---------------- GET ALL EVENTS ----------------

from fastapi import Query

@app.get("/events", response_model=list[schemas.EventResponse])
def get_events(
    db: Session = Depends(get_db),
    search: str = Query(None),
    skip: int = 0,
    limit: int = 5
):
    query = db.query(models.Event)

    # 🔍 Search
    if search:
        query = query.filter(models.Event.title.contains(search))

    # 📄 Pagination
    events = query.offset(skip).limit(limit).all()

    return events


@app.get("/events/my-events", response_model=list[schemas.EventResponse])
def get_my_events(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    events = db.query(models.Event).filter(
        models.Event.organizer_id == current_user.id
    ).all()

    return events

# ---------------- GET SINGLE EVENT ----------------

@app.get("/events/{event_id}", response_model=schemas.EventResponse)
def get_event(event_id: int, db: Session = Depends(get_db)):

    event = db.query(models.Event).filter(
        models.Event.id == event_id
    ).first()

    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")

    return event


# ---------------- REGISTER ----------------

@app.post("/events/{event_id}/register", response_model=schemas.RegistrationResponse)
def register_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    event = db.query(models.Event).filter(models.Event.id == event_id).first()

    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")

    existing = db.query(models.Registration).filter(
        models.Registration.event_id == event_id,
        models.Registration.user_id == current_user.id
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="User already registered")

    confirmed_count = db.query(models.Registration).filter(
        models.Registration.event_id == event_id,
        models.Registration.status == "confirmed"
    ).count()

    status = "confirmed" if confirmed_count < event.capacity else "waitlist"

    registration = models.Registration(
        user_id=current_user.id,
        event_id=event_id,
        status=status
    )

    db.add(registration)
    db.commit()
    db.refresh(registration)

    return registration




# ---------------- CANCEL ----------------

@app.delete("/events/{event_id}/cancel")
def cancel_registration(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    registration = db.query(models.Registration).filter(
        models.Registration.event_id == event_id,
        models.Registration.user_id == current_user.id
    ).first()

    if registration is None:
        raise HTTPException(status_code=404, detail="Registration not found")

    registration.status = "cancelled"

    waitlisted = db.query(models.Registration).filter(
        models.Registration.event_id == event_id,
        models.Registration.status == "waitlist"
    ).first()

    if waitlisted:
        waitlisted.status = "confirmed"

    db.commit()

    return {"message": "Registration cancelled"}


# ---------------- REGISTRATIONS ----------------

@app.get("/events/{event_id}/registrations", response_model=list[schemas.RegistrationResponse])
def get_event_registrations(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):

    event = db.query(models.Event).filter(models.Event.id == event_id).first()

    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.organizer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only organizer can view registrations")

    return db.query(models.Registration).filter(
        models.Registration.event_id == event_id
    ).all()


@app.get("/events/{event_id}/analytics")
def get_event_analytics(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    event = db.query(models.Event).filter(models.Event.id == event_id).first()

    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")

    if event.organizer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    confirmed = db.query(models.Registration).filter(
        models.Registration.event_id == event_id,
        models.Registration.status == "confirmed"
    ).count()

    waitlist = db.query(models.Registration).filter(
        models.Registration.event_id == event_id,
        models.Registration.status == "waitlist"
    ).count()

    cancelled = db.query(models.Registration).filter(
        models.Registration.event_id == event_id,
        models.Registration.status == "cancelled"
    ).count()

    remaining_spots = event.capacity - confirmed

    return {
        "confirmed": confirmed,
        "waitlist": waitlist,
        "cancelled": cancelled,
        "remaining_spots": remaining_spots
    }
# ---------------- MY REGISTRATION ----------------

@app.get("/events/{event_id}/my-registration")
def get_my_registration(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    registration = db.query(models.Registration).filter(
        models.Registration.event_id == event_id,
        models.Registration.user_id == current_user.id
    ).first()

    return registration


# ---------------- MY REGISTRATIONS ----------------

@app.get("/registrations/my", response_model=list[schemas.RegistrationResponse])
def get_my_registrations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Registration).filter(
        models.Registration.user_id == current_user.id
    ).all()