# Task Plan — Restaurant Booking Engine

**Goal:** Build a modular FastAPI booking engine runnable on a local server.
**Source plan:** `2026-04-04-booking-engine.md`
**Project dir:** `restaurant-booking/`

---

## Phase 1: Project Scaffold — `complete`
- [x] requirements.txt
- [x] .env.example
- [x] pyproject.toml
- [x] alembic.ini
- [x] src/config.py
- [x] src/main.py

## Phase 2: Core Infrastructure — `complete`
- [x] src/database.py
- [x] src/errors.py
- [x] src/auth.py

## Phase 3: SQLAlchemy Models — `complete`
- [x] src/models/restaurant.py
- [x] src/models/table.py
- [x] src/models/time_slot.py
- [x] src/models/calendar_rule.py
- [x] src/models/guest.py
- [x] src/models/booking.py
- [x] src/models/waitlist.py
- [x] src/models/notification_log.py
- [x] src/models/__init__.py

## Phase 4: Alembic Migration — `complete`
- [x] migrations/env.py
- [x] migrations/script.py.mako
- [x] migrations/versions/001_initial_schema.py

## Phase 5: Business Modules — `complete`
- [x] src/modules/__init__.py
- [x] src/modules/availability.py
- [x] src/modules/guests.py
- [x] src/modules/reservations.py
- [x] src/modules/waitlist.py
- [x] src/modules/notifications.py

## Phase 6: Schemas — `complete`
- [x] src/schemas/__init__.py
- [x] src/schemas/availability.py
- [x] src/schemas/booking.py
- [x] src/schemas/guest.py
- [x] src/schemas/waitlist.py
- [x] src/schemas/config.py
- [x] src/schemas/table.py

## Phase 7: Routers — `complete`
- [x] src/routers/__init__.py
- [x] src/routers/availability.py
- [x] src/routers/bookings.py
- [x] src/routers/guests.py
- [x] src/routers/waitlist.py
- [x] src/routers/config.py
- [x] src/routers/tables.py

## Phase 8: Tests — `complete`
- [x] tests/conftest.py
- [x] tests/test_errors.py
- [x] tests/test_auth.py
- [x] tests/test_availability.py
- [x] tests/test_guests.py
- [x] tests/test_reservations.py
- [x] tests/test_waitlist.py
- [x] tests/test_notifications.py
- [x] tests/test_integration.py

## Phase 9: Verify & Run — `in_progress`
- [ ] pip install -r requirements.txt
- [ ] createdb restaurant_booking + restaurant_booking_test
- [ ] alembic upgrade head
- [ ] uvicorn src.main:app --reload

---

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| (none yet) | | |

## Key Decisions
- Project root: `/Users/alvaroibanezvazquez/Desktop/AI Restaurant/restaurant-booking/`
- Python path: `.` (so `src.*` imports work)
- No git commits — user is on macOS, not Windows (plan had Windows paths)
- `.env` must be created from `.env.example` before running
