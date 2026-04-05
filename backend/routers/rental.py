# routers/rental.py
from fastapi import APIRouter, HTTPException, Header, UploadFile, File, Form
from typing import Optional
import os, shutil, uuid
from models.rental_schemas import BookingCreateSchema
from services import rental_service

router = APIRouter(prefix="/api/rental", tags=["Equipment Rental"])

# Folder to save uploaded images
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "static", "equipment_images")
os.makedirs(UPLOAD_DIR, exist_ok=True)


def get_user(x_user_id: Optional[str] = None) -> str:
    if not x_user_id:
        raise HTTPException(status_code=401, detail="X-User-Id header required")
    return x_user_id


# ─── FARMER ENDPOINTS ────────────────────────────────────────────────

@router.get("/equipment")
async def get_all_equipment():
    """Get all available equipment (farmers browse this)"""
    try:
        equipment = await rental_service.get_all_equipment()
        return {"success": True, "message": "Equipment fetched", "data": equipment}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/book")
async def create_booking(payload: BookingCreateSchema, x_user_id: Optional[str] = Header(None)):
    """Farmer books equipment"""
    user_id = get_user(x_user_id)
    try:
        booking = await rental_service.create_booking(
            user_id, payload.equipment_id, payload.start_time, payload.end_time
        )
        return {"success": True, "message": "Booking created", "data": booking}
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
    """Get farmer's active bookings"""
    user_id = get_user(x_user_id)
    try:
        bookings = await rental_service.get_active_bookings(user_id)
        return {"success": True, "message": "Active bookings fetched", "data": bookings}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/bookings/history")
async def get_booking_history(x_user_id: Optional[str] = Header(None)):
    """Get farmer's full booking history"""
    user_id = get_user(x_user_id)
    try:
        bookings = await rental_service.get_booking_history(user_id)
        return {"success": True, "message": "History fetched", "data": bookings}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/book/{booking_id}")
async def cancel_booking(booking_id: str, x_user_id: Optional[str] = Header(None)):
    """Cancel a booking"""
    user_id = get_user(x_user_id)
    try:
        booking = await rental_service.cancel_booking(booking_id, user_id)
        return {"success": True, "message": "Booking cancelled", "data": booking}
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── VENDOR ENDPOINTS ────────────────────────────────────────────────

@router.get("/vendor/equipment")
async def get_vendor_equipment(x_user_id: Optional[str] = Header(None)):
    """Get all equipment added by this vendor"""
    vendor_id = get_user(x_user_id)
    try:
        equipment = await rental_service.get_vendor_equipment(vendor_id)
        return {"success": True, "message": "Vendor equipment fetched", "data": equipment}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/vendor/equipment")
async def add_equipment(
    name: str = Form(...),
    type: str = Form(...),
    price_per_hour: float = Form(...),
    image: Optional[UploadFile] = File(None),
    x_user_id: Optional[str] = Header(None)
):
    """Vendor adds new equipment with optional image"""
    vendor_id = get_user(x_user_id)
    try:
        image_url = None

        # Save image if provided
        if image and image.filename:
            ext = image.filename.split(".")[-1]
            filename = f"{uuid.uuid4()}.{ext}"
            filepath = os.path.join(UPLOAD_DIR, filename)
            with open(filepath, "wb") as f:
                shutil.copyfileobj(image.file, f)
            image_url = f"/static/equipment_images/{filename}"

        equipment = await rental_service.add_equipment(
            vendor_id, name, type, price_per_hour, image_url
        )
        return {"success": True, "message": "Equipment added", "data": equipment}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/vendor/equipment/{equipment_id}")
async def update_equipment(
    equipment_id: str,
    name: Optional[str] = Form(None),
    type: Optional[str] = Form(None),
    price_per_hour: Optional[float] = Form(None),
    image: Optional[UploadFile] = File(None),
    x_user_id: Optional[str] = Header(None)
):
    """Vendor updates their equipment"""
    vendor_id = get_user(x_user_id)
    try:
        updates = {}
        if name: updates["name"] = name
        if type: updates["type"] = type
        if price_per_hour: updates["price_per_hour"] = price_per_hour

        if image and image.filename:
            ext = image.filename.split(".")[-1]
            filename = f"{uuid.uuid4()}.{ext}"
            filepath = os.path.join(UPLOAD_DIR, filename)
            with open(filepath, "wb") as f:
                shutil.copyfileobj(image.file, f)
            updates["image_url"] = f"/static/equipment_images/{filename}"

        equipment = await rental_service.update_equipment(equipment_id, vendor_id, updates)
        return {"success": True, "message": "Equipment updated", "data": equipment}
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/vendor/equipment/{equipment_id}")
async def delete_equipment(equipment_id: str, x_user_id: Optional[str] = Header(None)):
    """Vendor deletes their equipment"""
    vendor_id = get_user(x_user_id)
    try:
        await rental_service.delete_equipment(equipment_id, vendor_id)
        return {"success": True, "message": "Equipment deleted", "data": None}
    except LookupError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/vendor/bookings")
async def get_vendor_bookings(x_user_id: Optional[str] = Header(None)):
    """Vendor sees all bookings on their equipment"""
    vendor_id = get_user(x_user_id)
    try:
        bookings = await rental_service.get_vendor_bookings(vendor_id)
        return {"success": True, "message": "Vendor bookings fetched", "data": bookings}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/equipment/{equipment_id}/availability")
async def get_equipment_availability(equipment_id: str):
    """Get all booked time slots for a specific equipment"""
    try:
        bookings = []
        async for booking in rental_service.bookings_collection.find({
            "equipment_id": equipment_id,
            "status": "active"
        }):
            bookings.append({
                "start_time": booking["start_time"].isoformat(),
                "end_time": booking["end_time"].isoformat(),
            })
        return {"success": True, "message": "Availability fetched", "data": bookings}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))