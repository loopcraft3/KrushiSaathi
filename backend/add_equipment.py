# add_equipment.py
# Run this ONCE to add sample equipment to MongoDB
# Usage: python add_equipment.py

import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "")

async def add_sample_equipment():
    client = AsyncIOMotorClient(MONGO_URI)
    db = client["krushisaathi"]
    collection = db["equipment"]

    # Check if equipment already exists
    count = await collection.count_documents({})
    if count > 0:
        print(f"✅ Equipment already exists ({count} items). Skipping.")
        return

    sample_equipment = [
        {"name": "Mahindra 575 Tractor", "type": "Tractor", "price_per_hour": 250},
        {"name": "Rotavator", "type": "Tillage Equipment", "price_per_hour": 150},
        {"name": "Seed Drill Machine", "type": "Sowing Equipment", "price_per_hour": 200},
        {"name": "Crop Sprayer", "type": "Spraying Equipment", "price_per_hour": 100},
        {"name": "Combine Harvester", "type": "Harvesting Equipment", "price_per_hour": 500},
        {"name": "Power Tiller", "type": "Tiller", "price_per_hour": 120},
    ]

    result = await collection.insert_many(sample_equipment)
    print(f"✅ Added {len(result.inserted_ids)} equipment items to MongoDB!")
    print("🌾 Refresh your browser — equipment will now show up.")

asyncio.run(add_sample_equipment())