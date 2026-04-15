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
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
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

    # 🔥 CHECK IF EMAIL EXISTS
    existing = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    hashed_pwd = hash_password(user.password)

    db_user = models.User(
        username=user.email,
        name=user.name,
        email=user.email,
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
        models.User.email == form_data.username
    ).first()

    if db_user is None:
        raise HTTPException(status_code=400, detail="Invalid credentials")

    if not verify_password(form_data.password, db_user.password):
        raise HTTPException(status_code=400, detail="Invalid credentials")

    access_token = create_access_token(
        data={"sub": db_user.email}
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

def require_admin(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Only admin can access this"
        )
    return current_user

@app.get("/admin/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin)
):
    total_users = db.query(models.User).count()
    total_events = db.query(models.Event).count()
    total_registrations = db.query(models.Registration).count()

    return {
        "total_users": total_users,
        "total_events": total_events,
        "total_registrations": total_registrations
    }
@app.get("/admin/users")
def get_all_users(
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin)
):
    return db.query(models.User).all()

@app.get("/admin/events")
def get_all_events(
    db: Session = Depends(get_db),
    admin: models.User = Depends(require_admin)
):
    return db.query(models.Event).all()

# ---------------- MY REGISTRATION ----------------

@app.get("/events/{event_id}/my-registration")
def get_my_registration(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    registration = db.query(models.Registration).filter(
        models.Registration.event_id == event_id,
        models.Registration.user_id == current_user.id,
        models.Registration.status.in_(["confirmed", "waitlist"])
    ).first()

    return registration
# ---------------- CREATE EVENT ----------------

@app.post("/events", response_model=schemas.EventResponse)
def create_event(
    event: schemas.EventCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "organizer":
        raise HTTPException(
            status_code=403,
            detail="Only organizer can create events"
        )

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
    models.Registration.user_id == current_user.id,
    models.Registration.status.in_(["confirmed", "waitlist"])
).first()

    if existing:
        raise HTTPException(
           status_code=400,
           detail="User already registered"
    )
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



# ---------------- MY REGISTRATIONS ----------------

@app.get("/registrations/my", response_model=list[schemas.RegistrationResponse])
def get_my_registrations(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Registration).filter(
        models.Registration.user_id == current_user.id
    ).all()


@app.delete("/events/{event_id}")
def delete_event(
    event_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    event = db.query(models.Event).filter(
        models.Event.id == event_id
    ).first()

    if event is None:
        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    if event.organizer_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to delete this event"
        )

    # Delete related registrations first
    db.query(models.Registration).filter(
        models.Registration.event_id == event_id
    ).delete()

    # Delete related notifications if needed later
    db.delete(event)

    db.commit()

    return {"message": "Event deleted successfully"}

@app.put("/events/{event_id}")
def update_event(
    event_id: int,
    updated_event: schemas.EventUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    event = db.query(models.Event).filter(
        models.Event.id == event_id
    ).first()

    if event is None:
        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    if event.organizer_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized"
        )

    event.title = updated_event.title
    event.description = updated_event.description
    event.date = updated_event.date
    event.capacity = updated_event.capacity

    db.commit()
    db.refresh(event)

    registrations = db.query(models.Registration).filter(
        models.Registration.event_id == event_id,
        models.Registration.status == "confirmed"
    ).all()

    for reg in registrations:
        notification = models.Notification(
            user_id=reg.user_id,
            message=f"The event '{event.title}' has been updated."
        )

        db.add(notification)

    db.commit()

    return {
        "message": "Event updated successfully"
    }


@app.get("/notifications", response_model=list[schemas.NotificationResponse])
def get_notifications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    return db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    ).all()
