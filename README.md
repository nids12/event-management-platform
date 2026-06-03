# SmartEvents
> A full-stack event management platform built for real-world usage — not just a demo.

**Stack:** FastAPI · React · SQLite · JWT · REST APIs  
**Status:** Live | [Demo Link](#) · [Frontend](#) · [Backend](#)

---

## What it does

SmartEvents is a complete event management system where organizers can create and manage events end-to-end — registrations, waitlists, notifications, and attendee tracking — without any manual coordination overhead.

Built to handle the kind of real usage patterns that break naive implementations: concurrent registrations, waitlist promotions happening in the right order, and notifications firing reliably.

---

## Why I built it

Most event management tools are either overkill (Eventbrite-level complexity) or too basic (a Google Form). I wanted to build something in the middle that actually works correctly under load and handles edge cases like waitlist promotion atomically.

The interesting engineering problems turned out to be:

- **Concurrent registration safety** — making sure two users registering at the same time for the last available slot don't both get confirmed
- **Waitlist promotion logic** — when someone cancels, the right person on the waitlist gets promoted and notified immediately
- **In-app notification system** — real-time alerts for event updates, registration confirmations, and waitlist status changes

---

## Architecture

```
Frontend (React)
    │
    ▼
FastAPI Backend
    │
    ├── Auth Module (JWT)
    ├── Event Service
    ├── Registration Service  ← handles concurrency + waitlist
    └── Notification Service
    │
    ▼
SQLite Database
```

The backend is structured as loosely-coupled services so each concern (auth, events, registrations, notifications) is isolated and testable independently.

---

## Key Features

- **Event lifecycle management** — create, publish, close, archive events
- **Registration + waitlist** — automatic waitlist promotion when slots free up
- **JWT auth** — secure login, role-based access (organizer vs attendee)
- **In-app notifications** — real-time alerts for event updates
- **100+ concurrent users** — tested under load, registration logic is safe under contention

---

## Technical Highlights

**Concurrency-safe registration**  
Used database-level constraints + application-level checks to prevent double-booking under concurrent load. The waitlist promotion runs as part of the same transaction as the cancellation, so there's no window where a slot is "free" but unassigned.

**JWT authentication flow**  
Access tokens + refresh token rotation. Organizers and attendees have separate permission scopes enforced at the API layer.

**RESTful API design**  
All endpoints follow REST conventions with proper status codes, error messages, and validation. Designed for easy integration — another frontend or mobile client could consume this API without changes.

---

## Running Locally

**Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend**
```bash
cd frontend
npm install
npm start
```

Backend runs on `http://localhost:8000`  
API docs (Swagger UI) at `http://localhost:8000/docs`  
Frontend runs on `http://localhost:3000`

---

## What I learned

The hardest part wasn't any individual feature — it was making sure the registration system behaved correctly under concurrent requests. Writing the waitlist promotion logic to be atomic took more thought than expected and taught me a lot about transaction design even in SQLite.

Also learned that building a notification system that's reliable (not just fires-and-forgets) requires thinking about failure modes from the start, not as an afterthought.

---

## Possible Improvements

- [ ] Switch from SQLite to PostgreSQL for production-level concurrency
- [ ] Add WebSocket support for live seat count updates
- [ ] Email notifications via SendGrid
- [ ] Admin dashboard with event analytics

---

*Built by [Nidhi Sarda](https://github.com/nids12)*
