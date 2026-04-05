# services/rental_service.py
from datetime import datetime, timezone
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
from dotenv import load_dotenv
load_dotenv()  

MONGO_URI = os.getenv("MONGO_URI", "")
client = AsyncIOMotorClient(MONGO_URI)
db = client["krushisaathi"]

equipment_collection = db["equipment"]
bookings_collection = db["bookings"]


def serialize_doc(doc: dict) -> dict:
    """Convert MongoDB ObjectId to string"""
    if doc is None:
        return None
    doc["_id"] = str(doc["_id"])
    if "user_id" in doc:
        doc["user_id"] = str(doc["user_id"])
    if "equipment_id" in doc:
        doc["equipment_id"] = str(doc["equipment_id"])
    if "vendor_id" in doc and doc["vendor_id"]:
        doc["vendor_id"] = str(doc["vendor_id"])
    return doc


async def get_all_equipment() -> list:
    """Fetch all equipment"""
    equipment_list = []
    async for item in equipment_collection.find():
        equipment_list.append(serialize_doc(item))
    return equipment_list


async def get_vendor_equipment(vendor_id: str) -> list:
    """Fetch equipment added by a specific vendor"""
    equipment_list = []
    async for item in equipment_collection.find({"vendor_id": vendor_id}):
        equipment_list.append(serialize_doc(item))
    return equipment_list


async def add_equipment(vendor_id: str, name: str, type: str, price_per_hour: float, image_url: str = None) -> dict:
    """Vendor adds new equipment"""
    doc = {
        "name": name,
        "type": type,
        "price_per_hour": price_per_hour,
        "vendor_id": vendor_id,
        "image_url": image_url,
        "created_at": datetime.now(timezone.utc),
    }
    result = await equipment_collection.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc


async def update_equipment(equipment_id: str, vendor_id: str, updates: dict) -> dict:
    """Vendor updates their equipment"""
    equipment = await equipment_collection.find_one({
        "_id": ObjectId(equipment_id),
        "vendor_id": vendor_id
    })
    if not equipment:
        raise LookupError("Equipment not found or you don't own it")

    await equipment_collection.update_one(
        {"_id": ObjectId(equipment_id)},
        {"$set": updates}
    )
    updated = await equipment_collection.find_one({"_id": ObjectId(equipment_id)})
    return serialize_doc(updated)


async def delete_equipment(equipment_id: str, vendor_id: str) -> bool:
    """Vendor deletes their equipment"""
    equipment = await equipment_collection.find_one({
        "_id": ObjectId(equipment_id),
        "vendor_id": vendor_id
    })
    if not equipment:
        raise LookupError("Equipment not found or you don't own it")

    await equipment_collection.delete_one({"_id": ObjectId(equipment_id)})
    return True


async def get_vendor_bookings(vendor_id: str) -> list:
    """Get all bookings for equipment owned by this vendor"""
    # First get all equipment IDs owned by vendor
    vendor_equipment = []
    async for item in equipment_collection.find({"vendor_id": vendor_id}):
        vendor_equipment.append(str(item["_id"]))

    if not vendor_equipment:
        return []

    # Get all bookings for those equipment
    bookings = []
    async for booking in bookings_collection.find({
        "equipment_id": {"$in": vendor_equipment}
    }):
        serialized = serialize_doc(booking)
        # Add equipment name to booking
        equip = await equipment_collection.find_one(
            {"_id": ObjectId(serialized["equipment_id"])}
        )
        if equip:
            serialized["equipment_name"] = equip["name"]
            serialized["equipment_image"] = equip.get("image_url")
        bookings.append(serialized)
    return bookings


async def is_time_slot_available(equipment_id: str, start_time: datetime, end_time: datetime) -> bool:
    """Check if time slot is available — no overlapping active bookings"""
    overlapping = await bookings_collection.find_one({
        "equipment_id": equipment_id,
        "status": "active",
        "start_time": {"$lt": end_time},
        "end_time": {"$gt": start_time},
    })
    return overlapping is None


async def create_booking(user_id: str, equipment_id: str, start_time: datetime, end_time: datetime) -> dict:
    """Create a new booking with overlap check and price calculation"""
    if start_time >= end_time:
        raise ValueError("start_time must be before end_time")

    equipment = await equipment_collection.find_one({"_id": ObjectId(equipment_id)})
    if not equipment:
        raise LookupError("Equipment not found")

    available = await is_time_slot_available(equipment_id, start_time, end_time)
    if not available:
        raise PermissionError("Already booked for this time slot. Choose a different time.")

    duration_hours = (end_time - start_time).total_seconds() / 3600
    total_price = round(duration_hours * equipment["price_per_hour"], 2)

    booking_doc = {
        "user_id": user_id,
        "equipment_id": equipment_id,
        "start_time": start_time,
        "end_time": end_time,
        "status": "active",
        "total_price": total_price,
        "created_at": datetime.now(timezone.utc),
    }

    result = await bookings_collection.insert_one(booking_doc)
    booking_doc["_id"] = str(result.inserted_id)
    booking_doc["user_id"] = str(booking_doc["user_id"])
    booking_doc["equipment_id"] = str(booking_doc["equipment_id"])
    booking_doc["equipment_name"] = equipment["name"]
    booking_doc["equipment_image"] = equipment.get("image_url")
    return booking_doc


async def get_active_bookings(user_id: str) -> list:
    """Get all active bookings for a user"""
    bookings = []
    async for booking in bookings_collection.find({"user_id": user_id, "status": "active"}):
        serialized = serialize_doc(booking)
        equip = await equipment_collection.find_one(
            {"_id": ObjectId(serialized["equipment_id"])}
        )
        if equip:
            serialized["equipment_name"] = equip["name"]
            serialized["equipment_image"] = equip.get("image_url")
        bookings.append(serialized)
    return bookings


async def get_booking_history(user_id: str) -> list:
    """Get ALL bookings (active + cancelled) for a user"""
    bookings = []
    async for booking in bookings_collection.find(
        {"user_id": user_id},
        sort=[("created_at", -1)]
    ):
        serialized = serialize_doc(booking)
        equip = await equipment_collection.find_one(
            {"_id": ObjectId(serialized["equipment_id"])}
        )
        if equip:
            serialized["equipment_name"] = equip["name"]
            serialized["equipment_image"] = equip.get("image_url")
        bookings.append(serialized)
    return bookings


async def cancel_booking(booking_id: str, user_id: str) -> dict:
    """Cancel a booking"""
    booking = await bookings_collection.find_one({
        "_id": ObjectId(booking_id),
        "user_id": user_id
    })

    if not booking:
        raise LookupError("Booking not found or no permission")

    if booking["status"] == "cancelled":
        raise ValueError("Already cancelled")

    await bookings_collection.update_one(
        {"_id": ObjectId(booking_id)},
        {"$set": {"status": "cancelled"}}
    )
    booking["status"] = "cancelled"
    return serialize_doc(booking)