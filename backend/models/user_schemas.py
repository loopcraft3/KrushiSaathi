# models/user_schemas.py  ← NEW FILE (create this, don't paste into rental_schemas.py)
from pydantic import BaseModel, EmailStr
from typing import Optional, List


class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    phone: Optional[str] = None
    village: Optional[str] = None
    aadhaar: Optional[str] = None
    role: Optional[str] = "farmer"
    place: Optional[str] = None
    land_area: Optional[float] = None
    farmer_type: Optional[str] = None
    bio: Optional[str] = None
    crops_grown: Optional[List[str]] = []


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    village: Optional[str] = None
    aadhaar: Optional[str] = None
    role: Optional[str] = None
    place: Optional[str] = None
    land_area: Optional[float] = None
    farmer_type: Optional[str] = None
    bio: Optional[str] = None
    crops_grown: Optional[List[str]] = None


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
    village: Optional[str] = None
    aadhaar: Optional[str] = None
    role: str
    place: Optional[str] = None
    land_area: Optional[float] = None
    farmer_type: Optional[str] = None
    bio: Optional[str] = None
    crops_grown: Optional[List[str]] = []


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut