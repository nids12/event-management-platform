from pydantic import BaseModel


# ---------------- USER ----------------

class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str


class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: str

    class Config:
        from_attributes = True


# ---------------- LOGIN ----------------

class LoginRequest(BaseModel):
    email: str
    password: str
# ---------------- EVENTS ----------------

class EventCreate(BaseModel):
    title: str
    description: str
    date: str
    capacity: int


class EventResponse(BaseModel):
    id: int
    title: str
    description: str
    date: str
    capacity: int
    organizer_id: int   # ✅ VERY IMPORTANT (for dashboard filter)

    class Config:
        from_attributes = True


# ---------------- REGISTRATION ----------------

class RegistrationResponse(BaseModel):
    id: int
    user_id: int
    event_id: int
    status: str

    class Config:
        from_attributes = True

class EventUpdate(BaseModel):
    title: str
    description: str
    date: str
    capacity: int

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    message: str
    is_read: bool

    class Config:
        from_attributes = True