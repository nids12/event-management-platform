from pydantic import BaseModel


# ---------------- USER ----------------

class UserCreate(BaseModel):
    username: str
    password: str
    role: str


class UserResponse(BaseModel):
    id: int
    username: str
    role: str

    class Config:
        from_attributes = True   # ✅ updated for Pydantic v2


# ---------------- LOGIN ----------------
# (Optional now, since we use OAuth2 form, but keep it)

class LoginRequest(BaseModel):
    username: str
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