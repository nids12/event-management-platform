from typing import Optional

from pydantic import BaseModel


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


class LoginRequest(BaseModel):
    email: str
    password: str


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
    organizer_id: int
    confirmed_count: int = 0
    status: str = "upcoming"

    class Config:
        from_attributes = True


class RegistrationResponse(BaseModel):
    id: int
    user_id: int
    event_id: int
    status: str
    user_name: Optional[str] = None
    user_email: Optional[str] = None

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
