# services/rental_service.py
"""
Rental Service - Business logic for Agricultural Equipment Rental
Handles equipment listing, booking creation, overlap detection, cancellation
"""
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from dotenv import load_dotenv
import os

load_dotenv()
# MongoDB connection
MONGO_URI = os.getenv("MONGO_URI", "")
client = AsyncIOMotorClient(MONGO_URI)
db = client["krushisaathi"]
print("Mongo URI:", MONGO_URI)
# Collections
equipment_collection = db["equipment"]
bookings_collection = db["bookings"]


def serialize_doc(doc: dict) -> dict:
    """Convert MongoDB ObjectId fields to strings for JSON response"""
    if doc is None:
        return None
    doc["_id"] = str(doc["_id"])
    if "user_id" in doc:
        doc["user_id"] = str(doc["user_id"])
    if "equipment_id" in doc:
        doc["equipment_id"] = str(doc["equipment_id"])
    return doc


async def get_all_equipment() -> list:
    """Fetch all equipment from database"""
    equipment_list = []
    async for item in equipment_collection.find():
        equipment_list.append(serialize_doc(item))
    return equipment_list


async def is_time_slot_available(equipment_id: str, start_time: datetime, end_time: datetime) -> bool:
    """
    Check if a time slot is available for an equipment.
    Overlap condition:
      existing booking overlaps if:
      (new start_time < existing end_time) AND (new end_time > existing start_time)
    Only checks ACTIVE bookings.
    Returns True if slot is available, False if there is an overlap.
    """
    overlapping = await bookings_collection.find_one({
        "equipment_id": equipment_id,
        "status": "active",
        "start_time": {"$lt": end_time},
        "end_time": {"$gt": start_time},
    })
    return overlapping is None


async def create_booking(user_id: str, equipment_id: str, start_time: datetime, end_time: datetime) -> dict:
    """
    Create a new equipment booking.
    Steps:
    1. Validate start < end
    2. Find equipment and get price
    3. Check time slot availability
    4. Calculate total price
    5. Insert booking into DB
    """
    # Step 1: Validate times
    if start_time >= end_time:
        raise ValueError("start_time must be before end_time")

    # Step 2: Find equipment
    equipment = await equipment_collection.find_one({"_id": ObjectId(equipment_id)})
    if not equipment:
        raise LookupError("Equipment not found")

    # Step 3: Check availability
    available = await is_time_slot_available(equipment_id, start_time, end_time)
    if not available:
        raise PermissionError("This equipment is already booked for the selected time slot. Please choose a different time.")

    # Step 4: Calculate total price
    duration_hours = (end_time - start_time).total_seconds() / 3600
    total_price = duration_hours * equipment["price_per_hour"]

    # Step 5: Create booking document
    booking_doc = {
        "user_id": user_id,
        "equipment_id": equipment_id,
        "start_time": start_time,
        "end_time": end_time,
        "status": "active",
        "total_price": round(total_price, 2),
        "created_at": datetime.now(timezone.utc),
    }

    result = await bookings_collection.insert_one(booking_doc)
    booking_doc["_id"] = str(result.inserted_id)
    booking_doc["user_id"] = str(booking_doc["user_id"])
    booking_doc["equipment_id"] = str(booking_doc["equipment_id"])
    booking_doc["equipment_name"] = equipment["name"]
    return booking_doc


async def get_active_bookings(user_id: str) -> list:
    """Get all active bookings for a specific user"""
    bookings = []
    async for booking in bookings_collection.find({"user_id": user_id, "status": "active"}):
        bookings.append(serialize_doc(booking))
    return bookings


async def cancel_booking(booking_id: str, user_id: str) -> dict:
    """
    Cancel a booking by setting status to 'cancelled'.
    Only the booking owner can cancel.
    """
    # Find booking that belongs to this user
    booking = await bookings_collection.find_one({
        "_id": ObjectId(booking_id),
        "user_id": user_id
    })

    if not booking:
        raise LookupError("Booking not found or you do not have permission to cancel it")

    if booking["status"] == "cancelled":
        raise ValueError("This booking is already cancelled")

    # Update status
    await bookings_collection.update_one(
        {"_id": ObjectId(booking_id)},
        {"$set": {"status": "cancelled"}}
    )

    booking["status"] = "cancelled"
    return serialize_doc(booking)