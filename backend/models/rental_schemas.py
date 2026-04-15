# models/rental_schemas.py
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class EquipmentSchema(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    name: str
    type: str
    price_per_hour: float
    vendor_id: Optional[str] = None
    image_url: Optional[str] = None

    class Config:
        populate_by_name = True


class BookingCreateSchema(BaseModel):
    equipment_id: str
    start_time: datetime
    end_time: datetime


class BookingResponseSchema(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    user_id: str
    equipment_id: str
    start_time: datetime
    end_time: datetime
    status: str
    total_price: float

    class Config:
        populate_by_name = True


class EquipmentCreateSchema(BaseModel):
    name: str
    type: str
    price_per_hour: float