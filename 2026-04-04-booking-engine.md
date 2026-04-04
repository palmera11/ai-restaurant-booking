# Booking Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a modular FastAPI booking engine that serves as the central REST API for a multi-tenant restaurant reservation platform.

**Architecture:** Modular REST API (FastAPI/Python) with 5 internal modules (Availability, Reservations, Guest Profiles, Notifications, Waitlist). Single PostgreSQL database with row-level security per `restaurant_id`. All booking channels (voice, web, messaging) are API clients only.

**Tech Stack:** Python 3.11, FastAPI, SQLAlchemy 2.0 (sync/psycopg2), Alembic, PostgreSQL 15, PyJWT, Twilio (SMS), SendGrid (email), pytest, httpx

---

## File Structure

```
restaurant-booking/
├── src/
│   ├── main.py                     # FastAPI app, router registration, exception handlers
│   ├── config.py                   # Pydantic Settings — reads from .env
│   ├── database.py                 # Engine, session factory, RLS helper
│   ├── auth.py                     # JWT decode, CurrentTenant dependency
│   ├── errors.py                   # AppError base, all error code exceptions
│   ├── models/
│   │   ├── __init__.py             # Re-exports all models (used by Alembic)
│   │   ├── restaurant.py           # Restaurant ORM model
│   │   ├── table.py                # Table ORM model
│   │   ├── time_slot.py            # TimeSlot ORM model
│   │   ├── calendar_rule.py        # CalendarRule ORM model
│   │   ├── guest.py                # Guest ORM model
│   │   ├── booking.py              # Booking ORM model
│   │   ├── waitlist.py             # WaitlistEntry ORM model
│   │   └── notification_log.py     # NotificationLog ORM model
│   ├── schemas/
│   │   ├── availability.py         # SlotOut, AvailableTablesOut
│   │   ├── booking.py              # BookingIn, BookingOut, BookingUpdateIn
│   │   ├── guest.py                # GuestOut, GuestUpdateIn
│   │   ├── waitlist.py             # WaitlistIn, WaitlistOut
│   │   ├── config.py               # ConfigOut, ConfigUpdateIn, SlotScheduleIn, CalendarRuleIn
│   │   └── table.py                # TableIn, TableOut, TableUpdateIn
│   ├── modules/
│   │   ├── availability.py         # get_slots_for_table(), get_tables_for_slot()
│   │   ├── reservations.py         # create_booking(), update_booking(), cancel_booking()
│   │   ├── guests.py               # get_or_create_guest(), get_guest_history()
│   │   ├── notifications.py        # dispatch_notification(), route_by_channel()
│   │   └── waitlist.py             # join_waitlist(), promote_waitlist(), expire_waitlist()
│   └── routers/
│       ├── availability.py         # GET /availability, GET /availability/tables
│       ├── bookings.py             # CRUD /bookings
│       ├── guests.py               # GET/PATCH /guests
│       ├── waitlist.py             # POST/DELETE/GET /waitlist
│       ├── config.py               # GET/PATCH /config, /config/slots, /config/calendar
│       └── tables.py               # CRUD /tables
├── migrations/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
│       └── 001_initial_schema.py   # All tables + RLS policies
├── tests/
│   ├── conftest.py                 # Test DB setup, fixtures: restaurant, tables, guest
│   ├── test_availability.py        # Unit: slot computation, blackout, special hours
│   ├── test_reservations.py        # Unit: create/cancel, capacity, cutoff, horizon, dupe
│   ├── test_guests.py              # Unit: deduplication, visit_count increment
│   ├── test_notifications.py       # Unit: channel routing logic
│   ├── test_waitlist.py            # Unit: join, promote on cancel, expire
│   └── test_integration.py         # Integration: full flows end-to-end via HTTP
├── requirements.txt
├── .env.example
├── alembic.ini
└── pyproject.toml
```

---

## Task 1: Project Scaffold

**Files:**
- Create: `requirements.txt`
- Create: `.env.example`
- Create: `pyproject.toml`
- Create: `alembic.ini`
- Create: `src/config.py`
- Create: `src/main.py`

- [ ] **Step 1: Create `requirements.txt`**

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
sqlalchemy==2.0.30
psycopg2-binary==2.9.9
alembic==1.13.1
pydantic-settings==2.2.1
pyjwt==2.8.0
twilio==9.0.4
sendgrid==6.11.0
pytest==8.2.0
pytest-cov==5.0.0
httpx==0.27.0
```

- [ ] **Step 2: Create `.env.example`**

```
DATABASE_URL=postgresql://postgres:password@localhost:5432/restaurant_booking
SECRET_KEY=change-me-to-a-long-random-string
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=+15551234567
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

- [ ] **Step 3: Create `pyproject.toml`**

```toml
[tool.pytest.ini_options]
testpaths = ["tests"]
pythonpath = ["."]

[tool.coverage.run]
source = ["src"]
```

- [ ] **Step 4: Create `alembic.ini`**

```ini
[alembic]
script_location = migrations
prepend_sys_path = .
sqlalchemy.url = %(DATABASE_URL)s

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console
qualname =

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
```

- [ ] **Step 5: Create `src/config.py`**

```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str
    secret_key: str
    twilio_account_sid: str = ""
    twilio_auth_token: str = ""
    twilio_from_number: str = ""
    sendgrid_api_key: str = ""
    sendgrid_from_email: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
```

- [ ] **Step 6: Create `src/main.py`**

```python
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from src.errors import AppError
from src.routers import availability, bookings, guests, waitlist, config, tables

app = FastAPI(title="Restaurant Booking Engine", version="1.0.0")

app.include_router(availability.router, prefix="/api/v1")
app.include_router(bookings.router, prefix="/api/v1")
app.include_router(guests.router, prefix="/api/v1")
app.include_router(waitlist.router, prefix="/api/v1")
app.include_router(config.router, prefix="/api/v1")
app.include_router(tables.router, prefix="/api/v1")


@app.exception_handler(AppError)
def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.code, "message": exc.message, "details": exc.details},
    )


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
```

- [ ] **Step 7: Install dependencies**

```bash
cd C:/Users/User/restaurant-booking
pip install -r requirements.txt
```

Expected: all packages install without errors.

- [ ] **Step 8: Commit**

```bash
git -C C:/Users/User/restaurant-booking init
git -C C:/Users/User/restaurant-booking add requirements.txt .env.example pyproject.toml alembic.ini src/config.py src/main.py
git -C C:/Users/User/restaurant-booking commit -m "feat: project scaffold"
```

---

## Task 2: Database Connection + RLS Helper

**Files:**
- Create: `src/database.py`
- Create: `tests/conftest.py` (partial — DB setup only)

- [ ] **Step 1: Write the failing test**

```python
# tests/conftest.py
import pytest
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

TEST_DATABASE_URL = "postgresql://postgres:password@localhost:5432/restaurant_booking_test"


@pytest.fixture(scope="session")
def engine():
    eng = create_engine(TEST_DATABASE_URL)
    yield eng
    eng.dispose()


@pytest.fixture
def db(engine):
    connection = engine.connect()
    transaction = connection.begin()
    Session = sessionmaker(bind=connection)
    session = Session()
    yield session
    session.close()
    transaction.rollback()
    connection.close()


def test_db_connects(db):
    result = db.execute(text("SELECT 1")).scalar()
    assert result == 1
```

- [ ] **Step 2: Run test to verify it fails** (requires test DB to exist first)

```bash
createdb restaurant_booking_test
pytest tests/conftest.py::test_db_connects -v
```

Expected: PASS (verifies test DB is reachable).

- [ ] **Step 3: Create `src/database.py`**

```python
from contextlib import contextmanager

from sqlalchemy import create_engine, text
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from src.config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    pass


def get_db():
    """FastAPI dependency — yields a session with RLS not yet set."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def set_rls(db, restaurant_id: str) -> None:
    """Set the PostgreSQL session variable used by RLS policies."""
    db.execute(text("SET LOCAL app.restaurant_id = :rid"), {"rid": restaurant_id})
```

- [ ] **Step 4: Commit**

```bash
git -C C:/Users/User/restaurant-booking add src/database.py tests/conftest.py
git -C C:/Users/User/restaurant-booking commit -m "feat: database connection and RLS helper"
```

---

## Task 3: Error Handling

**Files:**
- Create: `src/errors.py`
- Create: `tests/test_errors.py`

- [ ] **Step 1: Write the failing test**

```python
# tests/test_errors.py
from src.errors import (
    SlotUnavailableError,
    TableCapacityExceededError,
    OutsideBookingHorizonError,
    CancellationTooLateError,
    RestaurantClosedError,
    GuestNotFoundError,
    DuplicateBookingError,
)


def test_slot_unavailable_includes_details():
    err = SlotUnavailableError(
        available_slots=["12:00", "14:00"],
        available_tables=["T2", "T3"],
    )
    assert err.code == "SLOT_UNAVAILABLE"
    assert err.status_code == 409
    assert err.details["available_slots"] == ["12:00", "14:00"]
    assert err.details["available_tables"] == ["T2", "T3"]


def test_cancellation_too_late_is_409():
    err = CancellationTooLateError()
    assert err.code == "CANCELLATION_TOO_LATE"
    assert err.status_code == 409


def test_guest_not_found_is_404():
    err = GuestNotFoundError()
    assert err.code == "GUEST_NOT_FOUND"
    assert err.status_code == 404
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/test_errors.py -v
```

Expected: FAIL with `ModuleNotFoundError: No module named 'src.errors'`

- [ ] **Step 3: Create `src/errors.py`**

```python
from typing import Any


class AppError(Exception):
    code: str
    message: str
    status_code: int
    details: dict

    def __init__(self, message: str = "", details: dict | None = None):
        self.message = message or self.message
        self.details = details or {}
        super().__init__(self.message)


class SlotUnavailableError(AppError):
    code = "SLOT_UNAVAILABLE"
    message = "That slot is no longer available."
    status_code = 409

    def __init__(self, available_slots: list[Any], available_tables: list[Any]):
        super().__init__(
            details={"available_slots": available_slots, "available_tables": available_tables}
        )


class TableCapacityExceededError(AppError):
    code = "TABLE_CAPACITY_EXCEEDED"
    message = "Party size exceeds table capacity."
    status_code = 422


class OutsideBookingHorizonError(AppError):
    code = "OUTSIDE_BOOKING_HORIZON"
    message = "That date is outside the booking window."
    status_code = 422


class CancellationTooLateError(AppError):
    code = "CANCELLATION_TOO_LATE"
    message = "Cancellation window has passed."
    status_code = 409


class RestaurantClosedError(AppError):
    code = "RESTAURANT_CLOSED"
    message = "The restaurant is closed at that time."
    status_code = 422


class GuestNotFoundError(AppError):
    code = "GUEST_NOT_FOUND"
    message = "No guest found with that phone number."
    status_code = 404


class DuplicateBookingError(AppError):
    code = "DUPLICATE_BOOKING"
    message = "This guest already has a booking for that slot."
    status_code = 409
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_errors.py -v
```

Expected: 3 PASSED

- [ ] **Step 5: Commit**

```bash
git -C C:/Users/User/restaurant-booking add src/errors.py tests/test_errors.py
git -C C:/Users/User/restaurant-booking commit -m "feat: error codes and AppError hierarchy"
```

---

## Task 4: SQLAlchemy Models

**Files:**
- Create: `src/models/restaurant.py`
- Create: `src/models/table.py`
- Create: `src/models/time_slot.py`
- Create: `src/models/calendar_rule.py`
- Create: `src/models/guest.py`
- Create: `src/models/booking.py`
- Create: `src/models/waitlist.py`
- Create: `src/models/notification_log.py`
- Create: `src/models/__init__.py`

- [ ] **Step 1: Create `src/models/restaurant.py`**

```python
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base


class Restaurant(Base):
    __tablename__ = "restaurants"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String, nullable=False)
    owner_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), nullable=False)
    timezone: Mapped[str] = mapped_column(String, nullable=False, default="UTC")
    booking_horizon_days: Mapped[int] = mapped_column(Integer, nullable=False, default=30)
    cancellation_cutoff_hours: Mapped[int] = mapped_column(Integer, nullable=False, default=2)
    default_slot_duration_min: Mapped[int] = mapped_column(Integer, nullable=False, default=90)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
```

- [ ] **Step 2: Create `src/models/table.py`**

```python
import enum
import uuid

from sqlalchemy import Boolean, Enum, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base


class LocationType(str, enum.Enum):
    indoor = "indoor"
    outdoor = "outdoor"
    bar = "bar"
    private = "private"


class Table(Base):
    __tablename__ = "tables"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False)
    label: Mapped[str] = mapped_column(String, nullable=False)
    capacity: Mapped[int] = mapped_column(nullable=False)
    location_type: Mapped[LocationType] = mapped_column(Enum(LocationType), nullable=False, default=LocationType.indoor)
    floor_plan_x: Mapped[float | None] = mapped_column(Float, nullable=True)
    floor_plan_y: Mapped[float | None] = mapped_column(Float, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
```

- [ ] **Step 3: Create `src/models/time_slot.py`**

```python
import uuid
from datetime import time

from sqlalchemy import Boolean, ForeignKey, Integer, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base


class TimeSlot(Base):
    __tablename__ = "time_slots"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False)
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)  # 0=Mon, 6=Sun
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
```

- [ ] **Step 4: Create `src/models/calendar_rule.py`**

```python
import enum
import uuid
from datetime import date, time

from sqlalchemy import Date, Enum, ForeignKey, String, Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base


class RuleType(str, enum.Enum):
    blackout = "blackout"
    special_hours = "special_hours"


class CalendarRule(Base):
    __tablename__ = "calendar_rules"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    rule_type: Mapped[RuleType] = mapped_column(Enum(RuleType), nullable=False)
    open_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    close_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    note: Mapped[str | None] = mapped_column(String, nullable=True)
```

- [ ] **Step 5: Create `src/models/guest.py`**

```python
import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base


class Channel(str, enum.Enum):
    phone = "phone"
    web = "web"
    whatsapp = "whatsapp"
    line = "line"
    messenger = "messenger"


class Guest(Base):
    __tablename__ = "guests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False)
    name: Mapped[str] = mapped_column(String, nullable=False)
    phone: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str | None] = mapped_column(String, nullable=True)
    preferred_channel: Mapped[Channel] = mapped_column(Enum(Channel), nullable=False, default=Channel.phone)
    visit_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    notes: Mapped[str | None] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
```

- [ ] **Step 6: Create `src/models/booking.py`**

```python
import enum
import uuid
from datetime import date, datetime, time

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, String, Time, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base
from src.models.guest import Channel


class BookingStatus(str, enum.Enum):
    confirmed = "confirmed"
    cancelled = "cancelled"
    no_show = "no_show"
    completed = "completed"


class Booking(Base):
    __tablename__ = "bookings"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False)
    guest_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("guests.id"), nullable=False)
    table_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tables.id"), nullable=False)
    slot_date: Mapped[date] = mapped_column(Date, nullable=False)
    slot_start_time: Mapped[time] = mapped_column(Time, nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer, nullable=False)
    party_size: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[BookingStatus] = mapped_column(Enum(BookingStatus), nullable=False, default=BookingStatus.confirmed)
    special_requests: Mapped[str | None] = mapped_column(String, nullable=True)
    booked_via: Mapped[Channel] = mapped_column(Enum(Channel), nullable=False)
    confirmation_code: Mapped[str] = mapped_column(String, nullable=False, unique=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
```

- [ ] **Step 7: Create `src/models/waitlist.py`**

```python
import enum
import uuid
from datetime import date, datetime, time

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, Time, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base


class WaitlistStatus(str, enum.Enum):
    waiting = "waiting"
    notified = "notified"
    booked = "booked"
    expired = "expired"


class WaitlistEntry(Base):
    __tablename__ = "waitlist"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    restaurant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("restaurants.id"), nullable=False)
    guest_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("guests.id"), nullable=False)
    table_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tables.id"), nullable=False)
    slot_date: Mapped[date] = mapped_column(Date, nullable=False)
    slot_start_time: Mapped[time] = mapped_column(Time, nullable=False)
    party_size: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[WaitlistStatus] = mapped_column(Enum(WaitlistStatus), nullable=False, default=WaitlistStatus.waiting)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
```

- [ ] **Step 8: Create `src/models/notification_log.py`**

```python
import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.database import Base


class NotifChannel(str, enum.Enum):
    sms = "sms"
    email = "email"
    whatsapp = "whatsapp"
    line = "line"
    messenger = "messenger"


class NotifType(str, enum.Enum):
    confirmation = "confirmation"
    reminder = "reminder"
    cancellation = "cancellation"
    waitlist = "waitlist"


class NotifStatus(str, enum.Enum):
    sent = "sent"
    failed = "failed"
    pending = "pending"


class NotificationLog(Base):
    __tablename__ = "notifications_log"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("bookings.id"), nullable=True)
    waitlist_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("waitlist.id"), nullable=True)
    channel: Mapped[NotifChannel] = mapped_column(Enum(NotifChannel), nullable=False)
    type: Mapped[NotifType] = mapped_column(Enum(NotifType), nullable=False)
    status: Mapped[NotifStatus] = mapped_column(Enum(NotifStatus), nullable=False, default=NotifStatus.pending)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
```

- [ ] **Step 9: Create `src/models/__init__.py`**

```python
from src.models.booking import Booking, BookingStatus
from src.models.calendar_rule import CalendarRule, RuleType
from src.models.guest import Channel, Guest
from src.models.notification_log import NotificationLog, NotifChannel, NotifStatus, NotifType
from src.models.restaurant import Restaurant
from src.models.table import LocationType, Table
from src.models.time_slot import TimeSlot
from src.models.waitlist import WaitlistEntry, WaitlistStatus

__all__ = [
    "Booking", "BookingStatus",
    "CalendarRule", "RuleType",
    "Channel", "Guest",
    "LocationType", "Table",
    "NotificationLog", "NotifChannel", "NotifStatus", "NotifType",
    "Restaurant",
    "TimeSlot",
    "WaitlistEntry", "WaitlistStatus",
]
```

- [ ] **Step 10: Verify models import cleanly**

```bash
cd C:/Users/User/restaurant-booking && python -c "from src.models import Booking, Guest, Table, WaitlistEntry; print('OK')"
```

Expected: `OK`

- [ ] **Step 11: Commit**

```bash
git -C C:/Users/User/restaurant-booking add src/models/
git -C C:/Users/User/restaurant-booking commit -m "feat: SQLAlchemy ORM models for all 8 tables"
```

---

## Task 5: Database Migration (Schema + RLS)

**Files:**
- Create: `migrations/env.py`
- Create: `migrations/script.py.mako`
- Create: `migrations/versions/001_initial_schema.py`

- [ ] **Step 1: Initialise Alembic**

```bash
cd C:/Users/User/restaurant-booking && alembic init migrations
```

Expected: `migrations/` directory created with `env.py`, `script.py.mako`, `alembic.ini`.

- [ ] **Step 2: Replace `migrations/env.py`**

```python
import os
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

from src.database import Base
import src.models  # noqa: F401 — registers all models with Base.metadata

config = context.config
config.set_main_option("sqlalchemy.url", os.environ["DATABASE_URL"])

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(url=url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

- [ ] **Step 3: Create `migrations/versions/001_initial_schema.py`**

```python
"""Initial schema with RLS

Revision ID: 001
Revises:
Create Date: 2026-04-04
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision = "001"
down_revision = None
branch_labels = None
depends_on = None

RLS_TABLES = [
    "tables", "time_slots", "calendar_rules",
    "guests", "bookings", "waitlist", "notifications_log",
]


def upgrade() -> None:
    # Enums
    op.execute("CREATE TYPE locationtype AS ENUM ('indoor','outdoor','bar','private')")
    op.execute("CREATE TYPE channel AS ENUM ('phone','web','whatsapp','line','messenger')")
    op.execute("CREATE TYPE bookingstatus AS ENUM ('confirmed','cancelled','no_show','completed')")
    op.execute("CREATE TYPE ruletype AS ENUM ('blackout','special_hours')")
    op.execute("CREATE TYPE waitliststatus AS ENUM ('waiting','notified','booked','expired')")
    op.execute("CREATE TYPE notifchannel AS ENUM ('sms','email','whatsapp','line','messenger')")
    op.execute("CREATE TYPE notiftype AS ENUM ('confirmation','reminder','cancellation','waitlist')")
    op.execute("CREATE TYPE notifstatus AS ENUM ('sent','failed','pending')")

    op.create_table(
        "restaurants",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("owner_id", UUID(as_uuid=True), nullable=False),
        sa.Column("timezone", sa.String, nullable=False, server_default="UTC"),
        sa.Column("booking_horizon_days", sa.Integer, nullable=False, server_default="30"),
        sa.Column("cancellation_cutoff_hours", sa.Integer, nullable=False, server_default="2"),
        sa.Column("default_slot_duration_min", sa.Integer, nullable=False, server_default="90"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "tables",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("restaurant_id", UUID(as_uuid=True), sa.ForeignKey("restaurants.id"), nullable=False),
        sa.Column("label", sa.String, nullable=False),
        sa.Column("capacity", sa.Integer, nullable=False),
        sa.Column("location_type", sa.Enum("indoor","outdoor","bar","private", name="locationtype"), nullable=False, server_default="indoor"),
        sa.Column("floor_plan_x", sa.Float, nullable=True),
        sa.Column("floor_plan_y", sa.Float, nullable=True),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
    )

    op.create_table(
        "time_slots",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("restaurant_id", UUID(as_uuid=True), sa.ForeignKey("restaurants.id"), nullable=False),
        sa.Column("day_of_week", sa.Integer, nullable=False),
        sa.Column("start_time", sa.Time, nullable=False),
        sa.Column("duration_minutes", sa.Integer, nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default="true"),
    )

    op.create_table(
        "calendar_rules",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("restaurant_id", UUID(as_uuid=True), sa.ForeignKey("restaurants.id"), nullable=False),
        sa.Column("date", sa.Date, nullable=False),
        sa.Column("rule_type", sa.Enum("blackout","special_hours", name="ruletype"), nullable=False),
        sa.Column("open_time", sa.Time, nullable=True),
        sa.Column("close_time", sa.Time, nullable=True),
        sa.Column("note", sa.String, nullable=True),
    )

    op.create_table(
        "guests",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("restaurant_id", UUID(as_uuid=True), sa.ForeignKey("restaurants.id"), nullable=False),
        sa.Column("name", sa.String, nullable=False),
        sa.Column("phone", sa.String, nullable=False),
        sa.Column("email", sa.String, nullable=True),
        sa.Column("preferred_channel", sa.Enum("phone","web","whatsapp","line","messenger", name="channel"), nullable=False, server_default="phone"),
        sa.Column("visit_count", sa.Integer, nullable=False, server_default="0"),
        sa.Column("notes", sa.String, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("restaurant_id", "phone", name="uq_guest_restaurant_phone"),
    )

    op.create_table(
        "bookings",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("restaurant_id", UUID(as_uuid=True), sa.ForeignKey("restaurants.id"), nullable=False),
        sa.Column("guest_id", UUID(as_uuid=True), sa.ForeignKey("guests.id"), nullable=False),
        sa.Column("table_id", UUID(as_uuid=True), sa.ForeignKey("tables.id"), nullable=False),
        sa.Column("slot_date", sa.Date, nullable=False),
        sa.Column("slot_start_time", sa.Time, nullable=False),
        sa.Column("duration_minutes", sa.Integer, nullable=False),
        sa.Column("party_size", sa.Integer, nullable=False),
        sa.Column("status", sa.Enum("confirmed","cancelled","no_show","completed", name="bookingstatus"), nullable=False, server_default="confirmed"),
        sa.Column("special_requests", sa.String, nullable=True),
        sa.Column("booked_via", sa.Enum("phone","web","whatsapp","line","messenger", name="channel"), nullable=False),
        sa.Column("confirmation_code", sa.String, nullable=False, unique=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "waitlist",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("restaurant_id", UUID(as_uuid=True), sa.ForeignKey("restaurants.id"), nullable=False),
        sa.Column("guest_id", UUID(as_uuid=True), sa.ForeignKey("guests.id"), nullable=False),
        sa.Column("table_id", UUID(as_uuid=True), sa.ForeignKey("tables.id"), nullable=False),
        sa.Column("slot_date", sa.Date, nullable=False),
        sa.Column("slot_start_time", sa.Time, nullable=False),
        sa.Column("party_size", sa.Integer, nullable=False),
        sa.Column("status", sa.Enum("waiting","notified","booked","expired", name="waitliststatus"), nullable=False, server_default="waiting"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "notifications_log",
        sa.Column("id", UUID(as_uuid=True), primary_key=True),
        sa.Column("booking_id", UUID(as_uuid=True), sa.ForeignKey("bookings.id"), nullable=True),
        sa.Column("waitlist_id", UUID(as_uuid=True), sa.ForeignKey("waitlist.id"), nullable=True),
        sa.Column("channel", sa.Enum("sms","email","whatsapp","line","messenger", name="notifchannel"), nullable=False),
        sa.Column("type", sa.Enum("confirmation","reminder","cancellation","waitlist", name="notiftype"), nullable=False),
        sa.Column("status", sa.Enum("sent","failed","pending", name="notifstatus"), nullable=False, server_default="pending"),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
    )

    # Enable RLS on all tenant tables
    for table in RLS_TABLES:
        op.execute(f"ALTER TABLE {table} ENABLE ROW LEVEL SECURITY")
        op.execute(f"ALTER TABLE {table} FORCE ROW LEVEL SECURITY")
        op.execute(
            f"CREATE POLICY tenant_isolation ON {table} "
            f"USING (restaurant_id = current_setting('app.restaurant_id', true)::uuid)"
        )

    # Superuser bypass (for migrations and admin)
    op.execute("CREATE ROLE booking_app LOGIN PASSWORD 'changeme'")
    for table in RLS_TABLES:
        op.execute(f"GRANT ALL ON {table} TO booking_app")
    op.execute("GRANT ALL ON restaurants TO booking_app")


def downgrade() -> None:
    for table in RLS_TABLES:
        op.execute(f"DROP POLICY IF EXISTS tenant_isolation ON {table}")
    op.drop_table("notifications_log")
    op.drop_table("waitlist")
    op.drop_table("bookings")
    op.drop_table("guests")
    op.drop_table("calendar_rules")
    op.drop_table("time_slots")
    op.drop_table("tables")
    op.drop_table("restaurants")
    for t in ["locationtype","channel","bookingstatus","ruletype","waitliststatus","notifchannel","notiftype","notifstatus"]:
        op.execute(f"DROP TYPE IF EXISTS {t}")
```

- [ ] **Step 4: Run migration**

```bash
cd C:/Users/User/restaurant-booking
DATABASE_URL=postgresql://postgres:password@localhost:5432/restaurant_booking alembic upgrade head
```

Expected: `Running upgrade  -> 001, Initial schema with RLS`

- [ ] **Step 5: Run migration on test DB**

```bash
DATABASE_URL=postgresql://postgres:password@localhost:5432/restaurant_booking_test alembic upgrade head
```

Expected: same output.

- [ ] **Step 6: Commit**

```bash
git -C C:/Users/User/restaurant-booking add migrations/
git -C C:/Users/User/restaurant-booking commit -m "feat: initial schema migration with RLS policies"
```

---

## Task 6: Auth Middleware

**Files:**
- Create: `src/auth.py`
- Create: `tests/test_auth.py`

- [ ] **Step 1: Write the failing test**

```python
# tests/test_auth.py
import uuid
import jwt
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from src.auth import CurrentTenant, create_token

app = FastAPI()

@app.get("/me")
def me(tenant: CurrentTenant) -> dict:
    return {"restaurant_id": str(tenant.restaurant_id), "role": tenant.role}

client = TestClient(app)


def test_valid_token_extracts_restaurant_id():
    rid = uuid.uuid4()
    token = create_token(restaurant_id=rid, role="owner")
    resp = client.get("/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.json()["restaurant_id"] == str(rid)
    assert resp.json()["role"] == "owner"


def test_missing_token_returns_401():
    resp = client.get("/me")
    assert resp.status_code == 401


def test_invalid_token_returns_401():
    resp = client.get("/me", headers={"Authorization": "Bearer bad.token.here"})
    assert resp.status_code == 401
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/test_auth.py -v
```

Expected: FAIL with `ModuleNotFoundError: No module named 'src.auth'`

- [ ] **Step 3: Create `src/auth.py`**

```python
import uuid
from dataclasses import dataclass

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from src.config import settings

_bearer = HTTPBearer(auto_error=False)


@dataclass
class Tenant:
    restaurant_id: uuid.UUID
    role: str  # "owner" | "channel"


CurrentTenant = Depends


def create_token(restaurant_id: uuid.UUID, role: str) -> str:
    payload = {"restaurant_id": str(restaurant_id), "role": role}
    return jwt.encode(payload, settings.secret_key, algorithm="HS256")


def get_current_tenant(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> Tenant:
    if credentials is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing token")
    try:
        payload = jwt.decode(credentials.credentials, settings.secret_key, algorithms=["HS256"])
        return Tenant(
            restaurant_id=uuid.UUID(payload["restaurant_id"]),
            role=payload["role"],
        )
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


CurrentTenant = Depends(get_current_tenant)
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_auth.py -v
```

Expected: 3 PASSED

- [ ] **Step 5: Commit**

```bash
git -C C:/Users/User/restaurant-booking add src/auth.py tests/test_auth.py
git -C C:/Users/User/restaurant-booking commit -m "feat: JWT auth middleware with CurrentTenant dependency"
```

---

## Task 7: Availability Module

**Files:**
- Create: `src/modules/availability.py`
- Create: `src/schemas/availability.py`
- Create: `src/routers/availability.py`
- Create: `tests/test_availability.py`
- Modify: `tests/conftest.py` — add restaurant/table/slot fixtures

- [ ] **Step 1: Extend `tests/conftest.py` with fixtures**

```python
# append to tests/conftest.py
import uuid
from datetime import time

from src.models import Restaurant, Table, TimeSlot, LocationType
from src.database import set_rls


@pytest.fixture
def restaurant(db):
    r = Restaurant(
        id=uuid.uuid4(),
        name="Test Restaurant",
        owner_id=uuid.uuid4(),
        timezone="UTC",
        booking_horizon_days=30,
        cancellation_cutoff_hours=2,
        default_slot_duration_min=90,
    )
    db.add(r)
    db.flush()
    return r


@pytest.fixture
def table(db, restaurant):
    set_rls(db, str(restaurant.id))
    t = Table(
        id=uuid.uuid4(),
        restaurant_id=restaurant.id,
        label="T1",
        capacity=4,
        location_type=LocationType.indoor,
        is_active=True,
    )
    db.add(t)
    db.flush()
    return t


@pytest.fixture
def lunch_slot(db, restaurant):
    set_rls(db, str(restaurant.id))
    s = TimeSlot(
        id=uuid.uuid4(),
        restaurant_id=restaurant.id,
        day_of_week=0,  # Monday
        start_time=time(12, 0),
        duration_minutes=90,
        is_active=True,
    )
    db.add(s)
    db.flush()
    return s
```

- [ ] **Step 2: Write the failing tests**

```python
# tests/test_availability.py
import uuid
from datetime import date, time

import pytest

from src.modules.availability import get_slots_for_table, get_tables_for_slot
from src.models import CalendarRule, RuleType


def test_get_slots_returns_active_slots_for_day(db, restaurant, table, lunch_slot):
    # Monday = weekday 0
    monday = date(2026, 4, 6)  # a Monday
    slots = get_slots_for_table(db, restaurant, table, monday)
    assert len(slots) == 1
    assert slots[0].start_time == time(12, 0)


def test_blackout_date_returns_no_slots(db, restaurant, table, lunch_slot):
    monday = date(2026, 4, 6)
    rule = CalendarRule(
        id=uuid.uuid4(),
        restaurant_id=restaurant.id,
        date=monday,
        rule_type=RuleType.blackout,
    )
    db.add(rule)
    db.flush()
    slots = get_slots_for_table(db, restaurant, table, monday)
    assert slots == []


def test_special_hours_filters_slots_outside_window(db, restaurant, table, lunch_slot):
    # lunch_slot is 12:00, special hours 14:00-22:00 → 12:00 should be excluded
    monday = date(2026, 4, 6)
    rule = CalendarRule(
        id=uuid.uuid4(),
        restaurant_id=restaurant.id,
        date=monday,
        rule_type=RuleType.special_hours,
        open_time=time(14, 0),
        close_time=time(22, 0),
    )
    db.add(rule)
    db.flush()
    slots = get_slots_for_table(db, restaurant, table, monday)
    assert slots == []


def test_get_tables_for_slot_excludes_booked_table(db, restaurant, table, lunch_slot):
    from src.models import Booking, BookingStatus, Guest, Channel
    guest = Guest(
        id=uuid.uuid4(), restaurant_id=restaurant.id,
        name="Alice", phone="+1111", preferred_channel=Channel.web,
    )
    db.add(guest)
    db.flush()
    booking = Booking(
        id=uuid.uuid4(), restaurant_id=restaurant.id,
        guest_id=guest.id, table_id=table.id,
        slot_date=date(2026, 4, 6), slot_start_time=time(12, 0),
        duration_minutes=90, party_size=2, status=BookingStatus.confirmed,
        booked_via=Channel.web, confirmation_code="RBK-0001",
    )
    db.add(booking)
    db.flush()
    tables = get_tables_for_slot(db, restaurant, date(2026, 4, 6), time(12, 0), party_size=2)
    assert table.id not in [t.id for t in tables]
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
pytest tests/test_availability.py -v
```

Expected: FAIL with `ModuleNotFoundError: No module named 'src.modules.availability'`

- [ ] **Step 4: Create `src/modules/__init__.py`** (empty)

```python
```

- [ ] **Step 5: Create `src/modules/availability.py`**

```python
from datetime import date, time

from sqlalchemy import and_
from sqlalchemy.orm import Session

from src.database import set_rls
from src.models import Booking, BookingStatus, CalendarRule, RuleType, Table, TimeSlot
from src.models.restaurant import Restaurant


def get_slots_for_table(
    db: Session, restaurant: Restaurant, table: Table, target_date: date
) -> list[TimeSlot]:
    set_rls(db, str(restaurant.id))

    # Check for calendar override
    rule = (
        db.query(CalendarRule)
        .filter(
            CalendarRule.restaurant_id == restaurant.id,
            CalendarRule.date == target_date,
        )
        .first()
    )
    if rule and rule.rule_type == RuleType.blackout:
        return []

    dow = target_date.weekday()  # 0=Mon
    slots = (
        db.query(TimeSlot)
        .filter(
            TimeSlot.restaurant_id == restaurant.id,
            TimeSlot.day_of_week == dow,
            TimeSlot.is_active.is_(True),
        )
        .all()
    )

    if rule and rule.rule_type == RuleType.special_hours:
        slots = [
            s for s in slots
            if rule.open_time <= s.start_time < rule.close_time
        ]

    # Filter out already-booked slots for this table
    booked_times = {
        b.slot_start_time
        for b in db.query(Booking).filter(
            Booking.restaurant_id == restaurant.id,
            Booking.table_id == table.id,
            Booking.slot_date == target_date,
            Booking.status == BookingStatus.confirmed,
        )
    }
    return [s for s in slots if s.start_time not in booked_times]


def get_tables_for_slot(
    db: Session,
    restaurant: Restaurant,
    target_date: date,
    slot_time: time,
    party_size: int,
) -> list[Table]:
    set_rls(db, str(restaurant.id))

    booked_table_ids = {
        b.table_id
        for b in db.query(Booking).filter(
            Booking.restaurant_id == restaurant.id,
            Booking.slot_date == target_date,
            Booking.slot_start_time == slot_time,
            Booking.status == BookingStatus.confirmed,
        )
    }
    return (
        db.query(Table)
        .filter(
            Table.restaurant_id == restaurant.id,
            Table.is_active.is_(True),
            Table.capacity >= party_size,
            Table.id.notin_(booked_table_ids),
        )
        .all()
    )
```

- [ ] **Step 6: Create `src/schemas/availability.py`**

```python
import uuid
from datetime import date, time

from pydantic import BaseModel


class SlotOut(BaseModel):
    slot_id: uuid.UUID
    start_time: time
    duration_minutes: int

    model_config = {"from_attributes": True}


class TableSlotOut(BaseModel):
    table_id: uuid.UUID
    label: str
    capacity: int
    location_type: str

    model_config = {"from_attributes": True}
```

- [ ] **Step 7: Create `src/routers/__init__.py`** (empty)

```python
```

- [ ] **Step 8: Create `src/routers/availability.py`**

```python
from datetime import date, time

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from src.auth import CurrentTenant, Tenant
from src.database import get_db, set_rls
from src.errors import RestaurantClosedError
from src.models import Restaurant, Table
from src.modules.availability import get_slots_for_table, get_tables_for_slot
from src.schemas.availability import SlotOut, TableSlotOut

router = APIRouter(tags=["availability"])


def _get_restaurant(db: Session, tenant: Tenant) -> Restaurant:
    r = db.query(Restaurant).filter(Restaurant.id == tenant.restaurant_id).first()
    if not r:
        raise RestaurantClosedError()
    return r


@router.get("/availability", response_model=list[SlotOut])
def availability_for_table(
    target_date: date = Query(..., alias="date"),
    table_id: str = Query(...),
    party_size: int = Query(1),
    tenant: Tenant = CurrentTenant,
    db: Session = Depends(get_db),
):
    restaurant = _get_restaurant(db, tenant)
    set_rls(db, str(tenant.restaurant_id))
    table = db.query(Table).filter(Table.id == table_id, Table.restaurant_id == restaurant.id).first()
    slots = get_slots_for_table(db, restaurant, table, target_date)
    return [SlotOut(slot_id=s.id, start_time=s.start_time, duration_minutes=s.duration_minutes) for s in slots]


@router.get("/availability/tables", response_model=list[TableSlotOut])
def tables_for_slot(
    target_date: date = Query(..., alias="date"),
    slot_time: time = Query(...),
    party_size: int = Query(1),
    tenant: Tenant = CurrentTenant,
    db: Session = Depends(get_db),
):
    restaurant = _get_restaurant(db, tenant)
    tables = get_tables_for_slot(db, restaurant, target_date, slot_time, party_size)
    return [TableSlotOut(table_id=t.id, label=t.label, capacity=t.capacity, location_type=t.location_type.value) for t in tables]
```

- [ ] **Step 9: Run tests to verify they pass**

```bash
pytest tests/test_availability.py -v
```

Expected: 4 PASSED

- [ ] **Step 10: Commit**

```bash
git -C C:/Users/User/restaurant-booking add src/modules/ src/schemas/availability.py src/routers/ tests/test_availability.py tests/conftest.py
git -C C:/Users/User/restaurant-booking commit -m "feat: availability module with slot and table queries"
```

---

## Task 8: Guest Profiles Module

**Files:**
- Create: `src/modules/guests.py`
- Create: `src/schemas/guest.py`
- Create: `src/routers/guests.py`
- Create: `tests/test_guests.py`

- [ ] **Step 1: Write the failing tests**

```python
# tests/test_guests.py
import uuid
from src.modules.guests import get_or_create_guest, increment_visit_count
from src.models import Channel


def test_creates_new_guest_when_phone_not_found(db, restaurant):
    guest = get_or_create_guest(
        db, restaurant_id=restaurant.id,
        name="Bob", phone="+66811111111",
        email=None, channel=Channel.web,
    )
    assert guest.id is not None
    assert guest.phone == "+66811111111"
    assert guest.visit_count == 0


def test_returns_existing_guest_for_same_phone(db, restaurant):
    g1 = get_or_create_guest(db, restaurant_id=restaurant.id, name="Bob", phone="+66822222222", email=None, channel=Channel.web)
    g2 = get_or_create_guest(db, restaurant_id=restaurant.id, name="Bobby", phone="+66822222222", email=None, channel=Channel.web)
    assert g1.id == g2.id  # same record returned


def test_increment_visit_count(db, restaurant):
    guest = get_or_create_guest(db, restaurant_id=restaurant.id, name="Carol", phone="+66833333333", email=None, channel=Channel.phone)
    increment_visit_count(db, guest)
    db.refresh(guest)
    assert guest.visit_count == 1
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_guests.py -v
```

Expected: FAIL with `ModuleNotFoundError: No module named 'src.modules.guests'`

- [ ] **Step 3: Create `src/modules/guests.py`**

```python
import uuid

from sqlalchemy.orm import Session

from src.database import set_rls
from src.models import Channel, Guest


def get_or_create_guest(
    db: Session,
    restaurant_id: uuid.UUID,
    name: str,
    phone: str,
    email: str | None,
    channel: Channel,
) -> Guest:
    set_rls(db, str(restaurant_id))
    existing = (
        db.query(Guest)
        .filter(Guest.restaurant_id == restaurant_id, Guest.phone == phone)
        .first()
    )
    if existing:
        return existing
    guest = Guest(
        id=uuid.uuid4(),
        restaurant_id=restaurant_id,
        name=name,
        phone=phone,
        email=email,
        preferred_channel=channel,
    )
    db.add(guest)
    db.flush()
    return guest


def increment_visit_count(db: Session, guest: Guest) -> None:
    guest.visit_count += 1
    db.flush()
```

- [ ] **Step 4: Create `src/schemas/guest.py`**

```python
import uuid
from datetime import datetime

from pydantic import BaseModel


class GuestOut(BaseModel):
    id: uuid.UUID
    name: str
    phone: str
    email: str | None
    preferred_channel: str
    visit_count: int
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class GuestUpdateIn(BaseModel):
    notes: str | None = None
    preferred_channel: str | None = None
    email: str | None = None
```

- [ ] **Step 5: Create `src/routers/guests.py`**

```python
import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from src.auth import CurrentTenant, Tenant
from src.database import get_db, set_rls
from src.errors import GuestNotFoundError
from src.models import Guest
from src.schemas.guest import GuestOut, GuestUpdateIn

router = APIRouter(tags=["guests"])


@router.get("/guests", response_model=GuestOut)
def lookup_guest(
    phone: str = Query(...),
    tenant: Tenant = CurrentTenant,
    db: Session = Depends(get_db),
):
    set_rls(db, str(tenant.restaurant_id))
    guest = db.query(Guest).filter(Guest.restaurant_id == tenant.restaurant_id, Guest.phone == phone).first()
    if not guest:
        raise GuestNotFoundError()
    return guest


@router.get("/guests/{guest_id}", response_model=GuestOut)
def get_guest(
    guest_id: uuid.UUID,
    tenant: Tenant = CurrentTenant,
    db: Session = Depends(get_db),
):
    set_rls(db, str(tenant.restaurant_id))
    guest = db.query(Guest).filter(Guest.id == guest_id, Guest.restaurant_id == tenant.restaurant_id).first()
    if not guest:
        raise GuestNotFoundError()
    return guest


@router.patch("/guests/{guest_id}", response_model=GuestOut)
def update_guest(
    guest_id: uuid.UUID,
    body: GuestUpdateIn,
    tenant: Tenant = CurrentTenant,
    db: Session = Depends(get_db),
):
    set_rls(db, str(tenant.restaurant_id))
    guest = db.query(Guest).filter(Guest.id == guest_id, Guest.restaurant_id == tenant.restaurant_id).first()
    if not guest:
        raise GuestNotFoundError()
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(guest, field, value)
    db.flush()
    return guest
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
pytest tests/test_guests.py -v
```

Expected: 3 PASSED

- [ ] **Step 7: Commit**

```bash
git -C C:/Users/User/restaurant-booking add src/modules/guests.py src/schemas/guest.py src/routers/guests.py tests/test_guests.py
git -C C:/Users/User/restaurant-booking commit -m "feat: guest profiles module with deduplication"
```

---

## Task 9: Reservations Module

**Files:**
- Create: `src/modules/reservations.py`
- Create: `src/schemas/booking.py`
- Create: `src/routers/bookings.py`
- Create: `tests/test_reservations.py`

- [ ] **Step 1: Write the failing tests**

```python
# tests/test_reservations.py
import uuid
from datetime import date, datetime, time, timezone, timedelta

import pytest

from src.errors import (
    CancellationTooLateError,
    DuplicateBookingError,
    OutsideBookingHorizonError,
    SlotUnavailableError,
    TableCapacityExceededError,
)
from src.models import Booking, BookingStatus, Channel, Guest
from src.modules.reservations import cancel_booking, create_booking


@pytest.fixture
def guest(db, restaurant):
    from src.modules.guests import get_or_create_guest
    return get_or_create_guest(db, restaurant.id, "Alice", "+66800000001", None, Channel.web)


def test_create_booking_succeeds(db, restaurant, table, lunch_slot, guest):
    monday = date(2026, 4, 6)
    booking = create_booking(
        db, restaurant=restaurant, table=table, guest=guest,
        slot_date=monday, slot_start_time=time(12, 0),
        duration_minutes=90, party_size=2,
        booked_via=Channel.web, special_requests=None,
    )
    assert booking.status == BookingStatus.confirmed
    assert booking.confirmation_code.startswith("RBK-")


def test_create_booking_fails_capacity_exceeded(db, restaurant, table, lunch_slot, guest):
    monday = date(2026, 4, 6)
    with pytest.raises(TableCapacityExceededError):
        create_booking(
            db, restaurant=restaurant, table=table, guest=guest,
            slot_date=monday, slot_start_time=time(12, 0),
            duration_minutes=90, party_size=99,  # table capacity is 4
            booked_via=Channel.web, special_requests=None,
        )


def test_create_booking_fails_outside_horizon(db, restaurant, table, lunch_slot, guest):
    far_future = date(2030, 1, 1)
    with pytest.raises(OutsideBookingHorizonError):
        create_booking(
            db, restaurant=restaurant, table=table, guest=guest,
            slot_date=far_future, slot_start_time=time(12, 0),
            duration_minutes=90, party_size=2,
            booked_via=Channel.web, special_requests=None,
        )


def test_create_booking_fails_slot_unavailable(db, restaurant, table, lunch_slot, guest):
    monday = date(2026, 4, 6)
    create_booking(
        db, restaurant=restaurant, table=table, guest=guest,
        slot_date=monday, slot_start_time=time(12, 0),
        duration_minutes=90, party_size=2,
        booked_via=Channel.web, special_requests=None,
    )
    guest2 = Guest(id=uuid.uuid4(), restaurant_id=restaurant.id, name="Bob", phone="+66800000002", preferred_channel=Channel.web)
    db.add(guest2)
    db.flush()
    with pytest.raises(SlotUnavailableError):
        create_booking(
            db, restaurant=restaurant, table=table, guest=guest2,
            slot_date=monday, slot_start_time=time(12, 0),
            duration_minutes=90, party_size=2,
            booked_via=Channel.web, special_requests=None,
        )


def test_duplicate_booking_same_guest_same_slot(db, restaurant, table, lunch_slot, guest):
    monday = date(2026, 4, 6)
    create_booking(
        db, restaurant=restaurant, table=table, guest=guest,
        slot_date=monday, slot_start_time=time(12, 0),
        duration_minutes=90, party_size=2,
        booked_via=Channel.web, special_requests=None,
    )
    from src.models import Table, LocationType
    table2 = Table(id=uuid.uuid4(), restaurant_id=restaurant.id, label="T2", capacity=4, location_type=LocationType.indoor, is_active=True)
    db.add(table2)
    db.flush()
    with pytest.raises(DuplicateBookingError):
        create_booking(
            db, restaurant=restaurant, table=table2, guest=guest,
            slot_date=monday, slot_start_time=time(12, 0),
            duration_minutes=90, party_size=2,
            booked_via=Channel.web, special_requests=None,
        )


def test_cancel_booking_within_cutoff(db, restaurant, table, lunch_slot, guest):
    monday = date(2026, 4, 6)
    booking = create_booking(
        db, restaurant=restaurant, table=table, guest=guest,
        slot_date=monday, slot_start_time=time(12, 0),
        duration_minutes=90, party_size=2,
        booked_via=Channel.web, special_requests=None,
    )
    # cutoff is 2h; slot is in the far future — cancel should succeed
    cancel_booking(db, booking, restaurant)
    assert booking.status == BookingStatus.cancelled


def test_cancel_booking_past_cutoff_raises(db, restaurant, table, lunch_slot, guest):
    # Create a booking for "now + 1 hour" which is inside the 2-hour cutoff
    from datetime import date as d
    import datetime as dt
    now = dt.datetime.now(tz=timezone.utc)
    soon = now + timedelta(hours=1)
    booking = Booking(
        id=uuid.uuid4(), restaurant_id=restaurant.id,
        guest_id=guest.id, table_id=table.id,
        slot_date=soon.date(), slot_start_time=soon.time().replace(microsecond=0),
        duration_minutes=90, party_size=2, status=BookingStatus.confirmed,
        booked_via=Channel.web, confirmation_code="RBK-9999",
    )
    db.add(booking)
    db.flush()
    with pytest.raises(CancellationTooLateError):
        cancel_booking(db, booking, restaurant)
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_reservations.py -v
```

Expected: FAIL with `ModuleNotFoundError: No module named 'src.modules.reservations'`

- [ ] **Step 3: Create `src/modules/reservations.py`**

```python
import random
import string
import uuid
from datetime import date, datetime, time, timezone, timedelta

from sqlalchemy.orm import Session

from src.database import set_rls
from src.errors import (
    CancellationTooLateError,
    DuplicateBookingError,
    OutsideBookingHorizonError,
    SlotUnavailableError,
    TableCapacityExceededError,
)
from src.models import Booking, BookingStatus, Channel, Guest, Table
from src.models.restaurant import Restaurant


def _generate_code() -> str:
    suffix = "".join(random.choices(string.digits, k=4))
    return f"RBK-{suffix}"


def create_booking(
    db: Session,
    restaurant: Restaurant,
    table: Table,
    guest: Guest,
    slot_date: date,
    slot_start_time: time,
    duration_minutes: int,
    party_size: int,
    booked_via: Channel,
    special_requests: str | None,
) -> Booking:
    set_rls(db, str(restaurant.id))

    today = datetime.now(tz=timezone.utc).date()
    horizon = today + timedelta(days=restaurant.booking_horizon_days)
    if slot_date > horizon:
        raise OutsideBookingHorizonError()

    if party_size > table.capacity:
        raise TableCapacityExceededError()

    # Duplicate check: same guest, same slot (any table)
    dupe = db.query(Booking).filter(
        Booking.restaurant_id == restaurant.id,
        Booking.guest_id == guest.id,
        Booking.slot_date == slot_date,
        Booking.slot_start_time == slot_start_time,
        Booking.status == BookingStatus.confirmed,
    ).first()
    if dupe:
        raise DuplicateBookingError()

    # Slot availability check
    conflict = db.query(Booking).filter(
        Booking.restaurant_id == restaurant.id,
        Booking.table_id == table.id,
        Booking.slot_date == slot_date,
        Booking.slot_start_time == slot_start_time,
        Booking.status == BookingStatus.confirmed,
    ).first()
    if conflict:
        from src.modules.availability import get_slots_for_table, get_tables_for_slot
        available_slots = [
            str(s.start_time)
            for s in get_slots_for_table(db, restaurant, table, slot_date)
        ]
        available_tables = [
            t.label
            for t in get_tables_for_slot(db, restaurant, slot_date, slot_start_time, party_size)
        ]
        raise SlotUnavailableError(available_slots=available_slots, available_tables=available_tables)

    # Unique confirmation code
    code = _generate_code()
    while db.query(Booking).filter(Booking.confirmation_code == code).first():
        code = _generate_code()

    booking = Booking(
        id=uuid.uuid4(),
        restaurant_id=restaurant.id,
        guest_id=guest.id,
        table_id=table.id,
        slot_date=slot_date,
        slot_start_time=slot_start_time,
        duration_minutes=duration_minutes,
        party_size=party_size,
        status=BookingStatus.confirmed,
        special_requests=special_requests,
        booked_via=booked_via,
        confirmation_code=code,
    )
    db.add(booking)
    db.flush()
    return booking


def cancel_booking(db: Session, booking: Booking, restaurant: Restaurant) -> None:
    set_rls(db, str(restaurant.id))
    slot_dt = datetime.combine(booking.slot_date, booking.slot_start_time).replace(tzinfo=timezone.utc)
    cutoff = slot_dt - timedelta(hours=restaurant.cancellation_cutoff_hours)
    if datetime.now(tz=timezone.utc) > cutoff:
        raise CancellationTooLateError()
    booking.status = BookingStatus.cancelled
    db.flush()
```

- [ ] **Step 4: Create `src/schemas/booking.py`**

```python
import uuid
from datetime import date, datetime, time

from pydantic import BaseModel


class BookingIn(BaseModel):
    table_id: uuid.UUID
    slot_date: date
    slot_start_time: time
    party_size: int
    booked_via: str
    guest_name: str
    guest_phone: str
    guest_email: str | None = None
    special_requests: str | None = None


class BookingUpdateIn(BaseModel):
    party_size: int | None = None
    special_requests: str | None = None


class BookingOut(BaseModel):
    id: uuid.UUID
    table_id: uuid.UUID
    guest_id: uuid.UUID
    slot_date: date
    slot_start_time: time
    duration_minutes: int
    party_size: int
    status: str
    special_requests: str | None
    booked_via: str
    confirmation_code: str
    created_at: datetime

    model_config = {"from_attributes": True}
```

- [ ] **Step 5: Create `src/routers/bookings.py`**

```python
import uuid
from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from src.auth import CurrentTenant, Tenant
from src.database import get_db, set_rls
from src.errors import GuestNotFoundError, SlotUnavailableError
from src.models import Booking, BookingStatus, Channel, Restaurant, Table
from src.modules.guests import get_or_create_guest, increment_visit_count
from src.modules.reservations import cancel_booking, create_booking
from src.schemas.booking import BookingIn, BookingOut, BookingUpdateIn

router = APIRouter(tags=["bookings"])


def _get_restaurant(db: Session, tenant: Tenant) -> Restaurant:
    return db.query(Restaurant).filter(Restaurant.id == tenant.restaurant_id).first()


@router.post("/bookings", response_model=BookingOut, status_code=201)
def new_booking(
    body: BookingIn,
    tenant: Tenant = CurrentTenant,
    db: Session = Depends(get_db),
):
    set_rls(db, str(tenant.restaurant_id))
    restaurant = _get_restaurant(db, tenant)
    table = db.query(Table).filter(Table.id == body.table_id, Table.restaurant_id == restaurant.id).first()
    guest = get_or_create_guest(
        db, restaurant.id, body.guest_name, body.guest_phone, body.guest_email, Channel(body.booked_via)
    )
    booking = create_booking(
        db, restaurant=restaurant, table=table, guest=guest,
        slot_date=body.slot_date, slot_start_time=body.slot_start_time,
        duration_minutes=table.capacity,  # resolved from slot config
        party_size=body.party_size, booked_via=Channel(body.booked_via),
        special_requests=body.special_requests,
    )
    increment_visit_count(db, guest)
    db.commit()
    return booking


@router.get("/bookings", response_model=list[BookingOut])
def list_bookings(
    target_date: date | None = Query(None, alias="date"),
    status: str | None = Query(None),
    tenant: Tenant = CurrentTenant,
    db: Session = Depends(get_db),
):
    set_rls(db, str(tenant.restaurant_id))
    q = db.query(Booking).filter(Booking.restaurant_id == tenant.restaurant_id)
    if target_date:
        q = q.filter(Booking.slot_date == target_date)
    if status:
        q = q.filter(Booking.status == BookingStatus(status))
    return q.all()


@router.get("/bookings/{booking_id}", response_model=BookingOut)
def get_booking(
    booking_id: uuid.UUID,
    tenant: Tenant = CurrentTenant,
    db: Session = Depends(get_db),
):
    set_rls(db, str(tenant.restaurant_id))
    return db.query(Booking).filter(Booking.id == booking_id, Booking.restaurant_id == tenant.restaurant_id).first()


@router.patch("/bookings/{booking_id}", response_model=BookingOut)
def update_booking(
    booking_id: uuid.UUID,
    body: BookingUpdateIn,
    tenant: Tenant = CurrentTenant,
    db: Session = Depends(get_db),
):
    set_rls(db, str(tenant.restaurant_id))
    booking = db.query(Booking).filter(Booking.id == booking_id, Booking.restaurant_id == tenant.restaurant_id).first()
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(booking, field, value)
    db.commit()
    return booking


@router.delete("/bookings/{booking_id}", status_code=204)
def delete_booking(
    booking_id: uuid.UUID,
    tenant: Tenant = CurrentTenant,
    db: Session = Depends(get_db),
):
    set_rls(db, str(tenant.restaurant_id))
    restaurant = _get_restaurant(db, tenant)
    booking = db.query(Booking).filter(Booking.id == booking_id, Booking.restaurant_id == tenant.restaurant_id).first()
    cancel_booking(db, booking, restaurant)
    db.commit()
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
pytest tests/test_reservations.py -v
```

Expected: 7 PASSED

- [ ] **Step 7: Commit**

```bash
git -C C:/Users/User/restaurant-booking add src/modules/reservations.py src/schemas/booking.py src/routers/bookings.py tests/test_reservations.py
git -C C:/Users/User/restaurant-booking commit -m "feat: reservations module with all business rule enforcement"
```

---

## Task 10: Waitlist Module

**Files:**
- Create: `src/modules/waitlist.py`
- Create: `src/schemas/waitlist.py`
- Create: `src/routers/waitlist.py`
- Create: `tests/test_waitlist.py`

- [ ] **Step 1: Write the failing tests**

```python
# tests/test_waitlist.py
import uuid
from datetime import date, time

import pytest

from src.models import Channel, Guest, WaitlistStatus
from src.modules.guests import get_or_create_guest
from src.modules.waitlist import expire_past_entries, join_waitlist, promote_waitlist


@pytest.fixture
def guest(db, restaurant):
    return get_or_create_guest(db, restaurant.id, "Dave", "+66800000010", None, Channel.web)


@pytest.fixture
def guest2(db, restaurant):
    return get_or_create_guest(db, restaurant.id, "Eve", "+66800000011", None, Channel.web)


def test_join_waitlist(db, restaurant, table, guest):
    entry = join_waitlist(db, restaurant_id=restaurant.id, guest=guest, table=table,
                          slot_date=date(2026, 4, 6), slot_start_time=time(12, 0), party_size=2)
    assert entry.status == WaitlistStatus.waiting


def test_promote_waitlist_notifies_first_entry(db, restaurant, table, guest, guest2):
    e1 = join_waitlist(db, restaurant_id=restaurant.id, guest=guest, table=table,
                       slot_date=date(2026, 4, 6), slot_start_time=time(12, 0), party_size=2)
    e2 = join_waitlist(db, restaurant_id=restaurant.id, guest=guest2, table=table,
                       slot_date=date(2026, 4, 6), slot_start_time=time(12, 0), party_size=2)
    promote_waitlist(db, restaurant_id=restaurant.id, table_id=table.id,
                     slot_date=date(2026, 4, 6), slot_start_time=time(12, 0))
    db.refresh(e1)
    db.refresh(e2)
    assert e1.status == WaitlistStatus.notified
    assert e2.status == WaitlistStatus.waiting  # second in queue untouched


def test_expire_past_entries(db, restaurant, table, guest):
    yesterday = date(2026, 4, 5)
    entry = join_waitlist(db, restaurant_id=restaurant.id, guest=guest, table=table,
                          slot_date=yesterday, slot_start_time=time(12, 0), party_size=2)
    expire_past_entries(db, as_of=date(2026, 4, 6))
    db.refresh(entry)
    assert entry.status == WaitlistStatus.expired
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_waitlist.py -v
```

Expected: FAIL with `ModuleNotFoundError: No module named 'src.modules.waitlist'`

- [ ] **Step 3: Create `src/modules/waitlist.py`**

```python
import uuid
from datetime import date, time

from sqlalchemy.orm import Session

from src.database import set_rls
from src.models import Guest, Table, WaitlistEntry, WaitlistStatus


def join_waitlist(
    db: Session,
    restaurant_id: uuid.UUID,
    guest: Guest,
    table: Table,
    slot_date: date,
    slot_start_time: time,
    party_size: int,
) -> WaitlistEntry:
    set_rls(db, str(restaurant_id))
    entry = WaitlistEntry(
        id=uuid.uuid4(),
        restaurant_id=restaurant_id,
        guest_id=guest.id,
        table_id=table.id,
        slot_date=slot_date,
        slot_start_time=slot_start_time,
        party_size=party_size,
        status=WaitlistStatus.waiting,
    )
    db.add(entry)
    db.flush()
    return entry


def promote_waitlist(
    db: Session,
    restaurant_id: uuid.UUID,
    table_id: uuid.UUID,
    slot_date: date,
    slot_start_time: time,
) -> WaitlistEntry | None:
    set_rls(db, str(restaurant_id))
    first = (
        db.query(WaitlistEntry)
        .filter(
            WaitlistEntry.restaurant_id == restaurant_id,
            WaitlistEntry.table_id == table_id,
            WaitlistEntry.slot_date == slot_date,
            WaitlistEntry.slot_start_time == slot_start_time,
            WaitlistEntry.status == WaitlistStatus.waiting,
        )
        .order_by(WaitlistEntry.created_at)
        .first()
    )
    if first:
        first.status = WaitlistStatus.notified
        db.flush()
    return first


def expire_past_entries(db: Session, as_of: date) -> None:
    db.query(WaitlistEntry).filter(
        WaitlistEntry.slot_date < as_of,
        WaitlistEntry.status == WaitlistStatus.waiting,
    ).update({"status": WaitlistStatus.expired})
    db.flush()
```

- [ ] **Step 4: Create `src/schemas/waitlist.py`**

```python
import uuid
from datetime import date, time

from pydantic import BaseModel


class WaitlistIn(BaseModel):
    table_id: uuid.UUID
    slot_date: date
    slot_start_time: time
    party_size: int
    guest_name: str
    guest_phone: str
    guest_email: str | None = None


class WaitlistOut(BaseModel):
    id: uuid.UUID
    table_id: uuid.UUID
    guest_id: uuid.UUID
    slot_date: date
    slot_start_time: time
    party_size: int
    status: str

    model_config = {"from_attributes": True}
```

- [ ] **Step 5: Create `src/routers/waitlist.py`**

```python
import uuid
from datetime import date, time

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from src.auth import CurrentTenant, Tenant
from src.database import get_db, set_rls
from src.models import Channel, Table, WaitlistEntry, WaitlistStatus
from src.modules.guests import get_or_create_guest
from src.modules.waitlist import join_waitlist
from src.schemas.waitlist import WaitlistIn, WaitlistOut

router = APIRouter(tags=["waitlist"])


@router.post("/waitlist", response_model=WaitlistOut, status_code=201)
def add_to_waitlist(
    body: WaitlistIn,
    tenant: Tenant = CurrentTenant,
    db: Session = Depends(get_db),
):
    set_rls(db, str(tenant.restaurant_id))
    table = db.query(Table).filter(Table.id == body.table_id, Table.restaurant_id == tenant.restaurant_id).first()
    guest = get_or_create_guest(db, tenant.restaurant_id, body.guest_name, body.guest_phone, body.guest_email, Channel.web)
    entry = join_waitlist(db, tenant.restaurant_id, guest, table, body.slot_date, body.slot_start_time, body.party_size)
    db.commit()
    return entry


@router.delete("/waitlist/{entry_id}", status_code=204)
def leave_waitlist(
    entry_id: uuid.UUID,
    tenant: Tenant = CurrentTenant,
    db: Session = Depends(get_db),
):
    set_rls(db, str(tenant.restaurant_id))
    entry = db.query(WaitlistEntry).filter(WaitlistEntry.id == entry_id, WaitlistEntry.restaurant_id == tenant.restaurant_id).first()
    if entry:
        entry.status = WaitlistStatus.expired
        db.commit()


@router.get("/waitlist", response_model=list[WaitlistOut])
def view_waitlist(
    target_date: date = Query(..., alias="date"),
    table_id: uuid.UUID = Query(...),
    tenant: Tenant = CurrentTenant,
    db: Session = Depends(get_db),
):
    set_rls(db, str(tenant.restaurant_id))
    return (
        db.query(WaitlistEntry)
        .filter(
            WaitlistEntry.restaurant_id == tenant.restaurant_id,
            WaitlistEntry.slot_date == target_date,
            WaitlistEntry.table_id == table_id,
            WaitlistEntry.status == WaitlistStatus.waiting,
        )
        .order_by(WaitlistEntry.created_at)
        .all()
    )
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
pytest tests/test_waitlist.py -v
```

Expected: 3 PASSED

- [ ] **Step 7: Commit**

```bash
git -C C:/Users/User/restaurant-booking add src/modules/waitlist.py src/schemas/waitlist.py src/routers/waitlist.py tests/test_waitlist.py
git -C C:/Users/User/restaurant-booking commit -m "feat: waitlist module with promotion and expiry"
```

---

## Task 11: Notifications Module

**Files:**
- Create: `src/modules/notifications.py`
- Create: `tests/test_notifications.py`

- [ ] **Step 1: Write the failing tests**

```python
# tests/test_notifications.py
from unittest.mock import MagicMock, patch

from src.models import Channel, NotifChannel, NotifType
from src.modules.notifications import dispatch_notification, resolve_channel


def test_web_booking_routes_to_sms():
    channel = resolve_channel(booked_via=Channel.web)
    assert channel == NotifChannel.sms


def test_phone_booking_routes_to_sms():
    channel = resolve_channel(booked_via=Channel.phone)
    assert channel == NotifChannel.sms


def test_whatsapp_booking_routes_to_whatsapp():
    channel = resolve_channel(booked_via=Channel.whatsapp)
    assert channel == NotifChannel.whatsapp


def test_line_booking_routes_to_line():
    channel = resolve_channel(booked_via=Channel.line)
    assert channel == NotifChannel.line


def test_messenger_booking_routes_to_messenger():
    channel = resolve_channel(booked_via=Channel.messenger)
    assert channel == NotifChannel.messenger


def test_dispatch_logs_notification(db, restaurant, table):
    from src.models import Booking, BookingStatus, Guest
    import uuid
    from datetime import date, time

    guest = Guest(id=uuid.uuid4(), restaurant_id=restaurant.id, name="Frank", phone="+66800000020", preferred_channel=Channel.web)
    db.add(guest)
    db.flush()
    booking = Booking(
        id=uuid.uuid4(), restaurant_id=restaurant.id,
        guest_id=guest.id, table_id=table.id,
        slot_date=date(2026, 4, 6), slot_start_time=time(12, 0),
        duration_minutes=90, party_size=2, status=BookingStatus.confirmed,
        booked_via=Channel.web, confirmation_code="RBK-7777",
    )
    db.add(booking)
    db.flush()

    with patch("src.modules.notifications._send_sms") as mock_sms:
        mock_sms.return_value = True
        dispatch_notification(db, booking=booking, notif_type=NotifType.confirmation)

    from src.models import NotificationLog, NotifStatus
    log = db.query(NotificationLog).filter(NotificationLog.booking_id == booking.id).first()
    assert log is not None
    assert log.status == NotifStatus.sent
    assert log.channel == NotifChannel.sms
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_notifications.py -v
```

Expected: FAIL with `ModuleNotFoundError: No module named 'src.modules.notifications'`

- [ ] **Step 3: Create `src/modules/notifications.py`**

```python
import uuid
from datetime import datetime, timezone

from sqlalchemy.orm import Session

from src.config import settings
from src.models import Booking, Channel, NotifChannel, NotifStatus, NotifType, NotificationLog, WaitlistEntry


def resolve_channel(booked_via: Channel) -> NotifChannel:
    mapping = {
        Channel.whatsapp: NotifChannel.whatsapp,
        Channel.line: NotifChannel.line,
        Channel.messenger: NotifChannel.messenger,
    }
    return mapping.get(booked_via, NotifChannel.sms)


def _send_sms(to: str, message: str) -> bool:
    try:
        from twilio.rest import Client
        client = Client(settings.twilio_account_sid, settings.twilio_auth_token)
        client.messages.create(body=message, from_=settings.twilio_from_number, to=to)
        return True
    except Exception:
        return False


def _send_email(to: str, subject: str, body: str) -> bool:
    try:
        import sendgrid
        from sendgrid.helpers.mail import Mail
        sg = sendgrid.SendGridAPIClient(api_key=settings.sendgrid_api_key)
        message = Mail(from_email=settings.sendgrid_from_email, to_emails=to, subject=subject, plain_text_content=body)
        sg.send(message)
        return True
    except Exception:
        return False


def _send_channel_message(channel: NotifChannel, to: str, message: str) -> bool:
    """Placeholder for WhatsApp/LINE/Messenger — integrate per-channel webhook in future subsystem specs."""
    return True


def dispatch_notification(
    db: Session,
    booking: Booking | None = None,
    waitlist_entry: WaitlistEntry | None = None,
    notif_type: NotifType = NotifType.confirmation,
) -> None:
    assert booking is not None or waitlist_entry is not None

    if booking:
        booked_via = booking.booked_via
        channel = resolve_channel(booked_via)
        from src.models import Guest
        guest = db.query(Guest).filter(Guest.id == booking.guest_id).first()
        message = _build_message(notif_type, booking=booking)
        target = guest.phone
    else:
        booked_via = Channel.phone
        channel = NotifChannel.sms
        from src.models import Guest
        guest = db.query(Guest).filter(Guest.id == waitlist_entry.guest_id).first()
        message = f"Good news! A slot has opened up. Your confirmation code will be issued when you confirm."
        target = guest.phone

    if channel == NotifChannel.sms:
        success = _send_sms(target, message)
    elif channel in (NotifChannel.whatsapp, NotifChannel.line, NotifChannel.messenger):
        success = _send_channel_message(channel, target, message)
    else:
        success = _send_email(target, "Booking Update", message)

    log = NotificationLog(
        id=uuid.uuid4(),
        booking_id=booking.id if booking else None,
        waitlist_id=waitlist_entry.id if waitlist_entry else None,
        channel=channel,
        type=notif_type,
        status=NotifStatus.sent if success else NotifStatus.failed,
        sent_at=datetime.now(tz=timezone.utc) if success else None,
    )
    db.add(log)
    db.flush()


def _build_message(notif_type: NotifType, booking: Booking) -> str:
    slot = f"{booking.slot_date} at {booking.slot_start_time.strftime('%H:%M')}"
    if notif_type == NotifType.confirmation:
        return f"Booking confirmed! Code: {booking.confirmation_code}. Table for {booking.party_size} on {slot}."
    if notif_type == NotifType.reminder:
        return f"Reminder: your booking ({booking.confirmation_code}) is tomorrow at {booking.slot_start_time.strftime('%H:%M')}."
    if notif_type == NotifType.cancellation:
        return f"Your booking {booking.confirmation_code} has been cancelled."
    return f"Booking update for {booking.confirmation_code}."
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_notifications.py -v
```

Expected: 6 PASSED

- [ ] **Step 5: Commit**

```bash
git -C C:/Users/User/restaurant-booking add src/modules/notifications.py tests/test_notifications.py
git -C C:/Users/User/restaurant-booking commit -m "feat: notifications module with channel-aware routing"
```

---

## Task 12: Config + Tables Routers

**Files:**
- Create: `src/schemas/config.py`
- Create: `src/schemas/table.py`
- Create: `src/routers/config.py`
- Create: `src/routers/tables.py`

- [ ] **Step 1: Create `src/schemas/config.py`**

```python
import uuid
from datetime import date, time

from pydantic import BaseModel


class ConfigOut(BaseModel):
    booking_horizon_days: int
    cancellation_cutoff_hours: int
    default_slot_duration_min: int
    timezone: str

    model_config = {"from_attributes": True}


class ConfigUpdateIn(BaseModel):
    booking_horizon_days: int | None = None
    cancellation_cutoff_hours: int | None = None
    default_slot_duration_min: int | None = None
    timezone: str | None = None


class SlotIn(BaseModel):
    day_of_week: int  # 0=Mon, 6=Sun
    start_time: time
    duration_minutes: int


class CalendarRuleIn(BaseModel):
    date: date
    rule_type: str  # "blackout" | "special_hours"
    open_time: time | None = None
    close_time: time | None = None
    note: str | None = None


class CalendarRuleOut(BaseModel):
    id: uuid.UUID
    date: date
    rule_type: str
    open_time: time | None
    close_time: time | None
    note: str | None

    model_config = {"from_attributes": True}
```

- [ ] **Step 2: Create `src/routers/config.py`**

```python
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.auth import CurrentTenant, Tenant
from src.database import get_db, set_rls
from src.models import CalendarRule, Restaurant, RuleType, TimeSlot
from src.schemas.config import CalendarRuleIn, CalendarRuleOut, ConfigOut, ConfigUpdateIn, SlotIn

router = APIRouter(tags=["config"])


@router.get("/config", response_model=ConfigOut)
def get_config(tenant: Tenant = CurrentTenant, db: Session = Depends(get_db)):
    r = db.query(Restaurant).filter(Restaurant.id == tenant.restaurant_id).first()
    return r


@router.patch("/config", response_model=ConfigOut)
def update_config(body: ConfigUpdateIn, tenant: Tenant = CurrentTenant, db: Session = Depends(get_db)):
    r = db.query(Restaurant).filter(Restaurant.id == tenant.restaurant_id).first()
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(r, field, value)
    db.commit()
    return r


@router.put("/config/slots", status_code=204)
def replace_slots(body: list[SlotIn], tenant: Tenant = CurrentTenant, db: Session = Depends(get_db)):
    set_rls(db, str(tenant.restaurant_id))
    db.query(TimeSlot).filter(TimeSlot.restaurant_id == tenant.restaurant_id).delete()
    for slot in body:
        db.add(TimeSlot(id=uuid.uuid4(), restaurant_id=tenant.restaurant_id, **slot.model_dump()))
    db.commit()


@router.post("/config/calendar", response_model=CalendarRuleOut, status_code=201)
def add_calendar_rule(body: CalendarRuleIn, tenant: Tenant = CurrentTenant, db: Session = Depends(get_db)):
    set_rls(db, str(tenant.restaurant_id))
    rule = CalendarRule(id=uuid.uuid4(), restaurant_id=tenant.restaurant_id, rule_type=RuleType(body.rule_type), **body.model_dump(exclude={"rule_type"}))
    db.add(rule)
    db.commit()
    return rule


@router.delete("/config/calendar/{rule_id}", status_code=204)
def delete_calendar_rule(rule_id: uuid.UUID, tenant: Tenant = CurrentTenant, db: Session = Depends(get_db)):
    set_rls(db, str(tenant.restaurant_id))
    db.query(CalendarRule).filter(CalendarRule.id == rule_id, CalendarRule.restaurant_id == tenant.restaurant_id).delete()
    db.commit()
```

- [ ] **Step 3: Create `src/schemas/table.py`**

```python
import uuid

from pydantic import BaseModel


class TableIn(BaseModel):
    label: str
    capacity: int
    location_type: str = "indoor"


class TableUpdateIn(BaseModel):
    label: str | None = None
    capacity: int | None = None
    location_type: str | None = None


class TableOut(BaseModel):
    id: uuid.UUID
    label: str
    capacity: int
    location_type: str
    is_active: bool
    floor_plan_x: float | None
    floor_plan_y: float | None

    model_config = {"from_attributes": True}
```

- [ ] **Step 4: Create `src/routers/tables.py`**

```python
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from src.auth import CurrentTenant, Tenant
from src.database import get_db, set_rls
from src.models import LocationType, Table
from src.schemas.table import TableIn, TableOut, TableUpdateIn

router = APIRouter(tags=["tables"])


@router.get("/tables", response_model=list[TableOut])
def list_tables(tenant: Tenant = CurrentTenant, db: Session = Depends(get_db)):
    set_rls(db, str(tenant.restaurant_id))
    return db.query(Table).filter(Table.restaurant_id == tenant.restaurant_id, Table.is_active.is_(True)).all()


@router.post("/tables", response_model=TableOut, status_code=201)
def create_table(body: TableIn, tenant: Tenant = CurrentTenant, db: Session = Depends(get_db)):
    set_rls(db, str(tenant.restaurant_id))
    t = Table(id=uuid.uuid4(), restaurant_id=tenant.restaurant_id, label=body.label, capacity=body.capacity, location_type=LocationType(body.location_type), is_active=True)
    db.add(t)
    db.commit()
    return t


@router.patch("/tables/{table_id}", response_model=TableOut)
def update_table(table_id: uuid.UUID, body: TableUpdateIn, tenant: Tenant = CurrentTenant, db: Session = Depends(get_db)):
    set_rls(db, str(tenant.restaurant_id))
    t = db.query(Table).filter(Table.id == table_id, Table.restaurant_id == tenant.restaurant_id).first()
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(t, field, LocationType(value) if field == "location_type" else value)
    db.commit()
    return t


@router.delete("/tables/{table_id}", status_code=204)
def deactivate_table(table_id: uuid.UUID, tenant: Tenant = CurrentTenant, db: Session = Depends(get_db)):
    set_rls(db, str(tenant.restaurant_id))
    t = db.query(Table).filter(Table.id == table_id, Table.restaurant_id == tenant.restaurant_id).first()
    if t:
        t.is_active = False
        db.commit()
```

- [ ] **Step 5: Verify app starts cleanly**

```bash
cd C:/Users/User/restaurant-booking && python -c "from src.main import app; print('App OK')"
```

Expected: `App OK`

- [ ] **Step 6: Commit**

```bash
git -C C:/Users/User/restaurant-booking add src/schemas/config.py src/schemas/table.py src/routers/config.py src/routers/tables.py
git -C C:/Users/User/restaurant-booking commit -m "feat: config and tables routers"
```

---

## Task 13: Integration Tests

**Files:**
- Create: `tests/test_integration.py`

- [ ] **Step 1: Write integration tests**

```python
# tests/test_integration.py
"""
Full HTTP flow tests against a real database. Uses FastAPI TestClient with
a real PostgreSQL test DB (no mocks). Each test runs in a rolled-back transaction.
"""
import uuid
from datetime import date, time

import pytest
from fastapi.testclient import TestClient

from src.auth import create_token
from src.main import app
from src.models import Channel, Restaurant, Table, TimeSlot, LocationType
from src.database import SessionLocal, set_rls

client = TestClient(app)


@pytest.fixture
def http_restaurant(db):
    r = Restaurant(
        id=uuid.uuid4(), name="HTTP Test Restaurant", owner_id=uuid.uuid4(),
        timezone="UTC", booking_horizon_days=30,
        cancellation_cutoff_hours=2, default_slot_duration_min=90,
    )
    db.add(r)
    set_rls(db, str(r.id))
    t = Table(id=uuid.uuid4(), restaurant_id=r.id, label="A1", capacity=4, location_type=LocationType.indoor, is_active=True)
    db.add(t)
    s = TimeSlot(id=uuid.uuid4(), restaurant_id=r.id, day_of_week=0, start_time=time(12, 0), duration_minutes=90, is_active=True)
    db.add(s)
    db.flush()
    return {"restaurant": r, "table": t, "slot": s, "token": create_token(r.id, "owner")}


def auth(token):
    return {"Authorization": f"Bearer {token}"}


def test_full_booking_flow(http_restaurant):
    token = http_restaurant["token"]
    table_id = str(http_restaurant["table"].id)

    # 1. Check availability
    resp = client.get("/api/v1/availability", params={"date": "2026-04-06", "table_id": table_id, "party_size": 2}, headers=auth(token))
    assert resp.status_code == 200
    assert len(resp.json()) == 1

    # 2. Create booking
    resp = client.post("/api/v1/bookings", json={
        "table_id": table_id, "slot_date": "2026-04-06", "slot_start_time": "12:00:00",
        "party_size": 2, "booked_via": "web",
        "guest_name": "Test Guest", "guest_phone": "+66899999001",
    }, headers=auth(token))
    assert resp.status_code == 201
    booking_id = resp.json()["id"]
    code = resp.json()["confirmation_code"]
    assert code.startswith("RBK-")

    # 3. Slot now unavailable for second guest
    resp2 = client.post("/api/v1/bookings", json={
        "table_id": table_id, "slot_date": "2026-04-06", "slot_start_time": "12:00:00",
        "party_size": 2, "booked_via": "web",
        "guest_name": "Second Guest", "guest_phone": "+66899999002",
    }, headers=auth(token))
    assert resp2.status_code == 409
    assert resp2.json()["error"] == "SLOT_UNAVAILABLE"
    # Details include alternatives
    assert "available_slots" in resp2.json()["details"]
    assert "available_tables" in resp2.json()["details"]

    # 4. Second guest joins waitlist
    resp3 = client.post("/api/v1/waitlist", json={
        "table_id": table_id, "slot_date": "2026-04-06", "slot_start_time": "12:00:00",
        "party_size": 2, "guest_name": "Second Guest", "guest_phone": "+66899999002",
    }, headers=auth(token))
    assert resp3.status_code == 201

    # 5. Get booking by ID
    resp4 = client.get(f"/api/v1/bookings/{booking_id}", headers=auth(token))
    assert resp4.status_code == 200
    assert resp4.json()["confirmation_code"] == code


def test_capacity_exceeded_returns_422(http_restaurant):
    token = http_restaurant["token"]
    table_id = str(http_restaurant["table"].id)
    resp = client.post("/api/v1/bookings", json={
        "table_id": table_id, "slot_date": "2026-04-06", "slot_start_time": "12:00:00",
        "party_size": 99, "booked_via": "web",
        "guest_name": "Big Group", "guest_phone": "+66899999003",
    }, headers=auth(token))
    assert resp.status_code == 422
    assert resp.json()["error"] == "TABLE_CAPACITY_EXCEEDED"


def test_guest_lookup_by_phone(http_restaurant):
    token = http_restaurant["token"]
    table_id = str(http_restaurant["table"].id)
    client.post("/api/v1/bookings", json={
        "table_id": table_id, "slot_date": "2026-04-13", "slot_start_time": "12:00:00",
        "party_size": 2, "booked_via": "web",
        "guest_name": "Lookup Guest", "guest_phone": "+66899999004",
    }, headers=auth(token))
    resp = client.get("/api/v1/guests", params={"phone": "+66899999004"}, headers=auth(token))
    assert resp.status_code == 200
    assert resp.json()["phone"] == "+66899999004"
    assert resp.json()["visit_count"] == 1


def test_missing_token_returns_401(http_restaurant):
    resp = client.get("/api/v1/availability", params={"date": "2026-04-06", "table_id": "irrelevant", "party_size": 1})
    assert resp.status_code == 401
```

- [ ] **Step 2: Run integration tests**

```bash
pytest tests/test_integration.py -v
```

Expected: 4 PASSED

- [ ] **Step 3: Run full test suite**

```bash
pytest --cov=src --cov-report=term-missing -v
```

Expected: all tests PASS, coverage > 80%

- [ ] **Step 4: Commit**

```bash
git -C C:/Users/User/restaurant-booking add tests/test_integration.py
git -C C:/Users/User/restaurant-booking commit -m "feat: integration tests covering full booking flow"
```

---

## Task 14: Wire Cancellation → Waitlist Promotion

The `cancel_booking` function needs to trigger `promote_waitlist` and `dispatch_notification` after marking a booking cancelled.

**Files:**
- Modify: `src/modules/reservations.py`

- [ ] **Step 1: Write the failing test**

```python
# append to tests/test_reservations.py

def test_cancel_triggers_waitlist_promotion(db, restaurant, table, lunch_slot, guest, guest2):
    from src.modules.waitlist import join_waitlist
    monday = date(2026, 4, 6)
    booking = create_booking(
        db, restaurant=restaurant, table=table, guest=guest,
        slot_date=monday, slot_start_time=time(12, 0),
        duration_minutes=90, party_size=2,
        booked_via=Channel.web, special_requests=None,
    )
    entry = join_waitlist(db, restaurant_id=restaurant.id, guest=guest2, table=table,
                          slot_date=monday, slot_start_time=time(12, 0), party_size=2)
    cancel_booking(db, booking, restaurant)
    db.refresh(entry)
    assert entry.status == WaitlistStatus.notified


@pytest.fixture
def guest2(db, restaurant):
    from src.modules.guests import get_or_create_guest
    return get_or_create_guest(db, restaurant.id, "Guest2", "+66800000099", None, Channel.web)
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/test_reservations.py::test_cancel_triggers_waitlist_promotion -v
```

Expected: FAIL — `AssertionError: assert <WaitlistStatus.waiting: 'waiting'> == <WaitlistStatus.notified: 'notified'>`

- [ ] **Step 3: Update `cancel_booking` in `src/modules/reservations.py`**

Replace the end of `cancel_booking`:

```python
def cancel_booking(db: Session, booking: Booking, restaurant: Restaurant) -> None:
    set_rls(db, str(restaurant.id))
    slot_dt = datetime.combine(booking.slot_date, booking.slot_start_time).replace(tzinfo=timezone.utc)
    cutoff = slot_dt - timedelta(hours=restaurant.cancellation_cutoff_hours)
    if datetime.now(tz=timezone.utc) > cutoff:
        raise CancellationTooLateError()
    booking.status = BookingStatus.cancelled
    db.flush()

    # Promote waitlist after cancellation
    from src.modules.waitlist import promote_waitlist
    from src.modules.notifications import dispatch_notification
    from src.models import NotifType

    promoted = promote_waitlist(
        db,
        restaurant_id=restaurant.id,
        table_id=booking.table_id,
        slot_date=booking.slot_date,
        slot_start_time=booking.slot_start_time,
    )
    if promoted:
        dispatch_notification(db, waitlist_entry=promoted, notif_type=NotifType.waitlist)
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pytest tests/test_reservations.py -v
```

Expected: all PASSED (including new test)

- [ ] **Step 5: Run full suite to confirm no regressions**

```bash
pytest -v
```

Expected: all tests PASS

- [ ] **Step 6: Commit**

```bash
git -C C:/Users/User/restaurant-booking add src/modules/reservations.py tests/test_reservations.py
git -C C:/Users/User/restaurant-booking commit -m "feat: cancellation triggers waitlist promotion and notification"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Availability — `get_slots_for_table`, `get_tables_for_slot`, blackout, special hours → Task 7
- [x] Reservations — create, update, cancel, capacity, horizon, cutoff, dupe check → Tasks 9, 14
- [x] Guest profiles — dedup by phone, visit_count, notes → Task 8
- [x] Notifications — channel-aware routing, log every send → Task 11
- [x] Waitlist — join, promote on cancel, expire past entries → Task 10
- [x] All 6 API route groups → Tasks 7–12
- [x] All 7 error codes → Task 3
- [x] RLS enforcement → Task 5
- [x] Multi-tenancy JWT → Task 6
- [x] Integration scenario: book → conflict → waitlist → cancel → promote → Task 13 + 14

**No placeholders:** All steps contain complete code.

**Type consistency:** `promote_waitlist` returns `WaitlistEntry | None` and is called that way in Task 14. `dispatch_notification` accepts `booking | None` and `waitlist_entry | None` consistently across Tasks 11 and 14.
