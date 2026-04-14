# routers/auth.py
# Authentication endpoints — register and login

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, List
from services import auth_service
from models.user_schemas import UserRegister, UserLogin, UserUpdate, UserOut, TokenResponse

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


class RegisterRequest(BaseModel):
    name: str
    username: str
    password: str
    role: str
    place: str = ""
    land_area: str = ""
    farmer_type: str = ""

class LoginRequest(BaseModel):
    username: str
    password: str

# ── NEW: request body for profile update ─────────────────────────────
class UpdateProfileRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    village: Optional[str] = None
    place: Optional[str] = None
    aadhaar: Optional[str] = None
    land_area: Optional[float] = None
    farmer_type: Optional[str] = None
    bio: Optional[str] = None
    crops_grown: Optional[List[str]] = None
    role: Optional[str] = None


@router.post("/register")
async def register(payload: RegisterRequest):
    """Register a new farmer or vendor"""
    try:
        result = await auth_service.register_user(
            name=payload.name,
            username=payload.username,
            password=payload.password,
            role=payload.role,
            place=payload.place,
            land_area=payload.land_area,
            farmer_type=payload.farmer_type,
        )
        return {"success": True, "message": "Account created successfully!", "data": result}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/login")
async def login(payload: LoginRequest):
    """Login with username and password"""
    try:
        result = await auth_service.login_user(
            username=payload.username,
            password=payload.password,
        )
        return {"success": True, "message": "Login successful!", "data": result}
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/me")
async def get_me(authorization: Optional[str] = Header(None)):
    """Get current logged in user from JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not logged in")

    token = authorization.replace("Bearer ", "")
    user = await auth_service.get_current_user(token)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    return {"success": True, "message": "User fetched", "data": user}


# ── NEW: update profile ───────────────────────────────────────────────
@router.put("/me")
async def update_me(
    payload: UpdateProfileRequest,
    authorization: Optional[str] = Header(None)
):
    """Update current user's profile"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not logged in")

    token = authorization.replace("Bearer ", "")
    user = await auth_service.get_current_user(token)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user_id = str(user["_id"])

    # Build update dict — only include fields that were actually sent
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}

    if not updates:
        return {"success": True, "message": "Nothing to update", "data": user}

    try:
        updated_user = await auth_service.update_user(user_id, updates)
        return {"success": True, "message": "Profile updated successfully!", "data": updated_user}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))