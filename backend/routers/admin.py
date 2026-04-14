# routers/admin.py
# Admin panel endpoints — only accessible with admin credentials

from fastapi import APIRouter, HTTPException, Header
from typing import Optional
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "")
ADMIN_USERNAME = os.getenv("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "krushi@admin123")

client = AsyncIOMotorClient(MONGO_URI)
db = client["krushisaathi"]
users_collection = db["users"]
equipment_collection = db["equipment"]
bookings_collection = db["bookings"]

router = APIRouter(prefix="/api/admin", tags=["Admin"])


def verify_admin(authorization: Optional[str]) -> bool:
    """Simple admin auth using Basic credentials"""
    if not authorization:
        return False
    import base64
    try:
        scheme, credentials = authorization.split(" ", 1)
        if scheme.lower() != "basic":
            return False
        decoded = base64.b64decode(credentials).decode("utf-8")
        username, password = decoded.split(":", 1)
        return username == ADMIN_USERNAME and password == ADMIN_PASSWORD
    except Exception:
        return False


def require_admin(authorization: Optional[str]):
    if not verify_admin(authorization):
        raise HTTPException(status_code=403, detail="Admin access required")


def serialize(doc: dict) -> dict:
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    if doc and "password" in doc:
        del doc["password"]
    return doc


# ── DASHBOARD STATS ──────────────────────────────────────────────────

@router.get("/stats")
async def get_stats(authorization: Optional[str] = Header(None)):
    """Get overall platform statistics"""
    require_admin(authorization)
    try:
        total_users = await users_collection.count_documents({})
        total_farmers = await users_collection.count_documents({"role": "farmer"})
        total_vendors = await users_collection.count_documents({"role": "vendor"})
        total_equipment = await equipment_collection.count_documents({})
        total_bookings = await bookings_collection.count_documents({})
        active_bookings = await bookings_collection.count_documents({"status": "active"})
        cancelled_bookings = await bookings_collection.count_documents({"status": "cancelled"})

        return {
            "success": True,
            "message": "Stats fetched",
            "data": {
                "users": {"total": total_users, "farmers": total_farmers, "vendors": total_vendors},
                "equipment": {"total": total_equipment},
                "bookings": {"total": total_bookings, "active": active_bookings, "cancelled": cancelled_bookings},
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── USERS ────────────────────────────────────────────────────────────

@router.get("/users")
async def get_all_users(authorization: Optional[str] = Header(None)):
    """Get all registered users"""
    require_admin(authorization)
    try:
        users = []
        async for user in users_collection.find():
            users.append(serialize(user))
        return {"success": True, "message": "Users fetched", "data": users}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, authorization: Optional[str] = Header(None)):
    """Delete a user"""
    require_admin(authorization)
    try:
        await users_collection.delete_one({"_id": ObjectId(user_id)})
        return {"success": True, "message": "User deleted", "data": None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── EQUIPMENT ────────────────────────────────────────────────────────

@router.get("/equipment")
async def get_all_equipment(authorization: Optional[str] = Header(None)):
    """Get all equipment"""
    require_admin(authorization)
    try:
        items = []
        async for item in equipment_collection.find():
            items.append(serialize(item))
        return {"success": True, "message": "Equipment fetched", "data": items}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/equipment/{equipment_id}")
async def delete_equipment(equipment_id: str, authorization: Optional[str] = Header(None)):
    """Delete equipment"""
    require_admin(authorization)
    try:
        await equipment_collection.delete_one({"_id": ObjectId(equipment_id)})
        return {"success": True, "message": "Equipment deleted", "data": None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── BOOKINGS ─────────────────────────────────────────────────────────

@router.get("/bookings")
async def get_all_bookings(authorization: Optional[str] = Header(None)):
    """Get all bookings"""
    require_admin(authorization)
    try:
        bookings = []
        async for booking in bookings_collection.find().sort("created_at", -1):
            serialized = serialize(booking)
            # Add equipment name
            if "equipment_id" in serialized:
                eq = await equipment_collection.find_one({"_id": ObjectId(serialized["equipment_id"])})
                if eq:
                    serialized["equipment_name"] = eq["name"]
            # Add user name
            if "user_id" in serialized:
                user = await users_collection.find_one({"_id": ObjectId(serialized["user_id"])})
                if user:
                    serialized["user_name"] = user["name"]
                    serialized["user_username"] = user["username"]
            bookings.append(serialized)
        return {"success": True, "message": "Bookings fetched", "data": bookings}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/bookings/{booking_id}")
async def cancel_booking(booking_id: str, authorization: Optional[str] = Header(None)):
    """Cancel a booking"""
    require_admin(authorization)
    try:
        await bookings_collection.update_one(
            {"_id": ObjectId(booking_id)},
            {"$set": {"status": "cancelled"}}
        )
        return {"success": True, "message": "Booking cancelled", "data": None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))