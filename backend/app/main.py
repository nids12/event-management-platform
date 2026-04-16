from datetime import datetime, timedelta
import threading
import time

from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm

from app.database import engine, get_db
from app import models, schemas
from app.security import hash_password, verify_password
from app.auth import create_access_token
from app.dependencies import get_current_user
from app.email_utils import parse_event_datetime, send_email
from app.database import SessionLocal

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
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:5175",
        "http://127.0.0.1:5175",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def queue_event_update_email(recipient_email: str, event_title: str, event_date: str):
    send_email(
        recipient_email,
        f"SmartEvent update: {event_title}",
        (
            f"Your event '{event_title}' has been updated.\n\n"
            f"Updated event date: {event_date}\n"
            "Please check the SmartEvent platform for the latest details."
        ),
    )


def queue_event_reminder_email(recipient_email: str, event_title: str, event_date: str):
    send_email(
        recipient_email,
        f"Reminder: {event_title} is in 1 day",
        (
            f"This is a reminder that '{event_title}' is happening soon.\n\n"
            f"Event date: {event_date}\n"
            "Please log in to SmartEvent for full event details."
        ),
    )


def build_event_update_message(old_event, new_title: str, new_description: str, new_date: str, new_capacity: int):
    changes = []

    if old_event.title != new_title:
        changes.append(f"title: {old_event.title} -> {new_title}")

    if old_event.description != new_description:
        changes.append("description was updated")

    if old_event.date != new_date:
        changes.append(f"date: {old_event.date} -> {new_date}")

    if old_event.capacity != new_capacity:
        changes.append(f"capacity: {old_event.capacity} -> {new_capacity}")

    if not changes:
        return f"The event '{new_title}' was updated, but no visible details changed."

    return f"The event '{new_title}' was updated. Changes: " + "; ".join(changes)


def queue_detailed_event_update_email(
    recipient_email: str,
    event_title: str,
    notification_message: str
):
    send_email(
        recipient_email,
        f"SmartEvent update: {event_title}",
        (
            f"{notification_message}\n\n"
            "Please check the SmartEvent platform for the latest event details."
        ),
    )


def normalize_event_date(value: str):
    parsed_date = parse_event_datetime(value)
    if parsed_date is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid event date format"
        )

    return parsed_date.strftime("%Y-%m-%dT%H:%M")


def validate_event_payload(title: str, description: str, event_date: str, capacity: int):
    normalized_title = title.strip()
    normalized_description = description.strip()

    if len(normalized_title) < 3:
        raise HTTPException(
            status_code=400,
            detail="Event title must be at least 3 characters"
        )

    if len(normalized_description) < 10:
        raise HTTPException(
            status_code=400,
            detail="Event description must be at least 10 characters"
        )

    if capacity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Capacity must be greater than 0"
        )

    parsed_date = parse_event_datetime(event_date)
    if parsed_date is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid event date format"
        )

    if parsed_date <= datetime.now():
        raise HTTPException(
            status_code=400,
            detail="Event date must be in the future"
        )

    return normalized_title, normalized_description, parsed_date.strftime("%Y-%m-%dT%H:%M")


def get_event_status(event, confirmed_count: int):
    event_datetime = parse_event_datetime(event.date)

    if event_datetime and event_datetime < datetime.now():
        return "completed"

    if confirmed_count >= event.capacity:
        return "full"

    return "upcoming"


def serialize_event(event, db: Session):
    confirmed_count = db.query(models.Registration).filter(
        models.Registration.event_id == event.id,
        models.Registration.status == "confirmed"
    ).count()

    return {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "date": event.date,
        "capacity": event.capacity,
        "organizer_id": event.organizer_id,
        "confirmed_count": confirmed_count,
        "status": get_event_status(event, confirmed_count),
    }


def send_due_event_reminders():
    db = SessionLocal()
    try:
        now = datetime.now()
        reminder_window_end = now + timedelta(days=1, minutes=5)

        registrations = db.query(models.Registration).filter(
            models.Registration.status == "confirmed"
        ).all()

        for registration in registrations:
            event = db.query(models.Event).filter(
                models.Event.id == registration.event_id
            ).first()
            user = db.query(models.User).filter(
                models.User.id == registration.user_id
            ).first()

            if event is None or user is None:
                continue

            event_datetime = parse_event_datetime(event.date)
            if event_datetime is None:
                continue

            if not (now <= event_datetime <= reminder_window_end):
                continue

            existing_log = db.query(models.ReminderLog).filter(
                models.ReminderLog.registration_id == registration.id,
                models.ReminderLog.reminder_type == "one_day"
            ).first()

            if existing_log:
                continue

            queue_event_reminder_email(user.email, event.title, event.date)

            db.add(
                models.ReminderLog(
                    registration_id=registration.id,
                    reminder_type="one_day"
                )
            )
            db.commit()
    finally:
        db.close()


def reminder_worker():
    while True:
        try:
            send_due_event_reminders()
        except Exception as exc:
            print(f"Reminder worker error: {exc}")
        time.sleep(60)


@app.on_event("startup")
def start_reminder_worker():
    thread = threading.Thread(target=reminder_worker, daemon=True)
    thread.start()


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
        "role": db_user.role,
        "user_id": db_user.id
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
    events = db.query(models.Event).order_by(models.Event.date.asc()).all()
    return [serialize_event(event, db) for event in events]

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

    title, description, normalized_date = validate_event_payload(
        event.title,
        event.description,
        event.date,
        event.capacity
    )

    db_event = models.Event(
        title=title,
        description=description,
        date=normalized_date,
        capacity=event.capacity,
        organizer_id=current_user.id
    )

    db.add(db_event)
    db.commit()
    db.refresh(db_event)

    # Notify all admins about new event creation
    admins = db.query(models.User).filter(models.User.role == "admin").all()
    for admin in admins:
        admin_notification = models.Notification(
            user_id=admin.id,
            message=f"New event '{title}' created by {current_user.email} (organizer)"
        )
        db.add(admin_notification)
    db.commit()

    return serialize_event(db_event, db)


# ---------------- GET ALL EVENTS ----------------

from fastapi import Query

@app.get("/events", response_model=list[schemas.EventResponse])
def get_events(
    db: Session = Depends(get_db),
    search: str = Query(None),
    skip: int = 0,
    limit: int = 5
):
    query = db.query(models.Event).order_by(models.Event.date.asc())

    # 🔍 Search
    if search:
        query = query.filter(models.Event.title.contains(search))

    # 📄 Pagination
    events = query.offset(skip).limit(limit).all()

    return [serialize_event(event, db) for event in events]


@app.get("/events/my-events", response_model=list[schemas.EventResponse])
def get_my_events(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    events = db.query(models.Event).filter(
        models.Event.organizer_id == current_user.id
    ).order_by(models.Event.date.asc()).all()

    return [serialize_event(event, db) for event in events]

# ---------------- GET SINGLE EVENT ----------------

@app.get("/events/{event_id}", response_model=schemas.EventResponse)
def get_event(event_id: int, db: Session = Depends(get_db)):

    event = db.query(models.Event).filter(
        models.Event.id == event_id
    ).first()

    if event is None:
        raise HTTPException(status_code=404, detail="Event not found")

    return serialize_event(event, db)


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

    # Prevent organizers from registering for their own events
    if event.organizer_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="Organizers cannot register for their own events"
        )

    existing = db.query(models.Registration).filter(
        models.Registration.event_id == event_id,
        models.Registration.user_id == current_user.id
    ).first()

    if existing and existing.status in ["confirmed", "waitlist"]:
        raise HTTPException(
            status_code=400,
            detail="User already registered"
        )

    confirmed_count = db.query(models.Registration).filter(
        models.Registration.event_id == event_id,
        models.Registration.status == "confirmed"
    ).count()

    status = "confirmed" if confirmed_count < event.capacity else "waitlist"

    if existing and existing.status == "cancelled":
        existing.status = status
        registration = existing
    else:
        registration = models.Registration(
            user_id=current_user.id,
            event_id=event_id,
            status=status
        )
        db.add(registration)

    db.commit()
    db.refresh(registration)

    # Notify organizer about new registration
    if event.organizer_id != current_user.id:  # Don't notify if organizer is registering themselves
        organizer_notification = models.Notification(
            user_id=event.organizer_id,
            message=f"New {status} registration for your event '{event.title}' from {current_user.email}"
        )
        db.add(organizer_notification)

    # Notify all admins about the registration
    admins = db.query(models.User).filter(models.User.role == "admin").all()
    for admin in admins:
        if admin.id != current_user.id:  # Don't notify if admin is registering
            admin_notification = models.Notification(
                user_id=admin.id,
                message=f"New {status} registration for event '{event.title}' by {current_user.email}"
            )
            db.add(admin_notification)

    db.commit()

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

    # Notify organizer about cancellation
    event = db.query(models.Event).filter(models.Event.id == event_id).first()
    if event and event.organizer_id != current_user.id:  # Don't notify if organizer is cancelling their own registration
        organizer_notification = models.Notification(
            user_id=event.organizer_id,
            message=f"Registration cancelled for your event '{event.title}' by {current_user.email}"
        )
        db.add(organizer_notification)

    # Notify all admins about the cancellation
    admins = db.query(models.User).filter(models.User.role == "admin").all()
    for admin in admins:
        if admin.id != current_user.id:  # Don't notify if admin is cancelling
            admin_notification = models.Notification(
                user_id=admin.id,
                message=f"Registration cancelled for event '{event.title}' by {current_user.email}"
            )
            db.add(admin_notification)

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

    registrations = db.query(models.Registration).filter(
        models.Registration.event_id == event_id
    ).all()

    enriched_registrations = []

    for registration in registrations:
        user = db.query(models.User).filter(
            models.User.id == registration.user_id
        ).first()

        enriched_registrations.append({
            "id": registration.id,
            "user_id": registration.user_id,
            "event_id": registration.event_id,
            "status": registration.status,
            "user_name": user.name if user else None,
            "user_email": user.email if user else None,
        })

    status_order = {"confirmed": 0, "waitlist": 1, "cancelled": 2}
    enriched_registrations.sort(
        key=lambda item: (status_order.get(item["status"], 99), item["user_name"] or "")
    )

    return enriched_registrations


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
    background_tasks: BackgroundTasks,
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

    title, description, normalized_date = validate_event_payload(
        updated_event.title,
        updated_event.description,
        updated_event.date,
        updated_event.capacity
    )

    notification_message = build_event_update_message(
        event,
        title,
        description,
        normalized_date,
        updated_event.capacity
    )

    event.title = title
    event.description = description
    event.date = normalized_date
    event.capacity = updated_event.capacity

    db.commit()
    db.refresh(event)

    registrations = db.query(models.Registration).filter(
        models.Registration.event_id == event_id,
        models.Registration.status.in_(["confirmed", "waitlist"])
    ).all()

    for reg in registrations:
        notification = models.Notification(
            user_id=reg.user_id,
            message=notification_message
        )

        db.add(notification)

        user = db.query(models.User).filter(
            models.User.id == reg.user_id
        ).first()
        if user:
            background_tasks.add_task(
                queue_detailed_event_update_email,
                user.email,
                event.title,
                notification_message
            )

    db.commit()

    # Notify the organizer about their successful update
    organizer_notification = models.Notification(
        user_id=current_user.id,
        message=f"Your event '{event.title}' has been successfully updated. {notification_message}"
    )
    db.add(organizer_notification)
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
    ).order_by(models.Notification.id.desc()).all()


@app.get("/notifications/unread-count")
def get_unread_notification_count(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    unread_count = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False
    ).count()

    return {"unread_count": unread_count}


@app.put("/notifications/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    notifications = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False
    ).all()

    for notification in notifications:
        notification.is_read = True

    db.commit()

    return {"message": "All notifications marked as read"}


@app.put("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == current_user.id
    ).first()

    if notification is None:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    notification.is_read = True
    db.commit()

    return {"message": "Notification marked as read"}


@app.delete("/notifications/{notification_id}")
def delete_notification(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == current_user.id
    ).first()

    if notification is None:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    db.delete(notification)
    db.commit()

    return {"message": "Notification deleted"}


@app.delete("/notifications")
def delete_all_notifications(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    notifications = db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    ).all()

    for notification in notifications:
        db.delete(notification)

    db.commit()

    return {"message": "All notifications deleted"}
