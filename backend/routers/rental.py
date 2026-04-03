# routers/rental.py
"""
Rental Router - API endpoints for Agricultural Equipment Rental System
All business logic is handled in services/rental_service.py
"""
from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from models.rental_schemas import BookingCreateSchema
from services import rental_service

router = APIRouter(prefix="/api/rental", tags=["Equipment Rental"])


def get_current_user(x_user_id: Optional[str] = Header(None)) -> str:
    """
    Simple user extraction from request header.
    In your full auth system, replace this with your actual JWT middleware.
    Frontend must send header: X-User-Id: <user_id>
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-Id header is required")
    return x_user_id


@router.get("/equipment")
async def get_all_equipment():
    """Get all available agricultural equipment"""
    try:
        equipment = await rental_service.get_all_equipment()
        return {"success": True, "message": "Equipment fetched successfully", "data": equipment}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/book")
async def create_booking(payload: BookingCreateSchema, x_user_id: Optional[str] = Header(None)):
    """Create a new equipment booking"""
    user_id = get_current_user(x_user_id)
    try:
        booking = await rental_service.create_booking(
            user_id=user_id,
            equipment_id=payload.equipment_id,
            start_time=payload.start_time,
            end_time=payload.end_time,
        )
        return {"success": True, "message": "Booking created successfully", "data": booking}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=409, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/bookings")
async def get_active_bookings(x_user_id: Optional[str] = Header(None)):
    """Get all active bookings of the logged-in user"""
    user_id = get_current_user(x_user_id)
    try:
        bookings = await rental_service.get_active_bookings(user_id)
        return {"success": True, "message": "Active bookings fetched successfully", "data": bookings}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/book/{booking_id}")
async def cancel_booking(booking_id: str, x_user_id: Optional[str] = Header(None)):
    """Cancel a booking by setting status to cancelled"""
    user_id = get_current_user(x_user_id)
    try:
        booking = await rental_service.cancel_booking(booking_id, user_id)
        return {"success": True, "message": "Booking cancelled successfully", "data": booking}
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))