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
