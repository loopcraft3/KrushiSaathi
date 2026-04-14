# services/auth_service.py
# Handles user registration, login, and JWT token creation

from datetime import datetime, timedelta, timezone
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "")
SECRET_KEY = os.getenv("JWT_SECRET", "krushisaathi_jwt_secret_2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

client = AsyncIOMotorClient(MONGO_URI)
db = client["krushisaathi"]
users_collection = db["users"]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__truncate_error=False)


def _truncate(password: str) -> str:
    """Truncate to 72 bytes — bcrypt's hard limit"""
    return password.encode("utf-8")[:72].decode("utf-8", errors="ignore")


def hash_password(password: str) -> str:
    return pwd_context.hash(_truncate(password))


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(_truncate(plain), hashed)

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None


async def register_user(name: str, username: str, password: str, role: str,
                        place: str = "", land_area: str = "", farmer_type: str = "") -> dict:
    existing = await users_collection.find_one({"username": username})
    if existing:
        raise ValueError("Username already taken. Please choose another.")

    if role not in ["farmer", "vendor"]:
        raise ValueError("Role must be 'farmer' or 'vendor'")

    user_doc = {
        "name": name,
        "username": username,
        "password": hash_password(password),
        "role": role,
        "place": place,
        "land_area": land_area,
        "farmer_type": farmer_type,
        "created_at": datetime.now(timezone.utc),
    }

    result = await users_collection.insert_one(user_doc)
    user_doc["_id"] = str(result.inserted_id)
    user_doc.pop("password")

    token = create_access_token({
        "sub": str(result.inserted_id),
        "username": username,
        "role": role,
        "name": name,
    })

    return {"user": user_doc, "token": token}

async def login_user(username: str, password: str) -> dict:
    """Login existing user"""
    user = await users_collection.find_one({"username": username})
    if not user:
        raise ValueError("Invalid username or password")

    if not verify_password(password, user["password"]):
        raise ValueError("Invalid username or password")

    user_id = str(user["_id"])

    token = create_access_token({
        "sub": user_id,
        "username": user["username"],
        "role": user["role"],
        "name": user["name"],
    })

    return {
        "user": {
            "_id": user_id,
            "name": user["name"],
            "username": user["username"],
            "role": user["role"],
        },
        "token": token
    }


async def get_current_user(token: str) -> Optional[dict]:
    """Verify JWT token and return user data"""
    payload = decode_token(token)
    if not payload:
        return None

    user_id = payload.get("sub")
    if not user_id:
        return None

    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    if not user:
        return None

    return {
    "_id": str(user["_id"]),
    "name": user["name"],
    "username": user["username"],
    "role": user["role"],
    "place": user.get("place", ""),
    "land_area": user.get("land_area", ""),
    "farmer_type": user.get("farmer_type", ""),
}

# ── ADD THIS FUNCTION to your existing services/auth_service.py ──────────────
# Paste it at the bottom of the file, alongside your existing register_user,
# login_user, get_current_user functions.

async def update_user(user_id: str, updates: dict) -> dict:
    """Update user fields in MongoDB and return updated user"""
    from bson import ObjectId

    await db["users"].update_one(
        {"_id": ObjectId(user_id)},
        {"$set": updates}
    )
    updated = await db["users"].find_one({"_id": ObjectId(user_id)})
    if not updated:
        raise ValueError("User not found")

    # Serialize — same pattern as your existing get_current_user
    updated["_id"] = str(updated["_id"])
    updated.pop("password", None)
    return updated