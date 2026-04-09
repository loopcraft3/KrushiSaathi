# add_equipment.py
# Run this to add sample equipment to MongoDB
# Usage: python add_equipment.py
# Safe to run multiple times — won't add duplicates

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

    sample_equipment = [
        # Tractors
        {"name": "Mahindra 575 Tractor", "type": "Tractor", "price_per_hour": 250},
        {"name": "John Deere 5050D Tractor", "type": "Tractor", "price_per_hour": 350},
        {"name": "Sonalika 60 Tractor", "type": "Tractor", "price_per_hour": 300},
        {"name": "TAFE 45 DI Tractor", "type": "Tractor", "price_per_hour": 220},
        {"name": "Eicher 380 Tractor", "type": "Tractor", "price_per_hour": 200},

        # Harvesting Equipment
        {"name": "Combine Harvester", "type": "Harvesting Equipment", "price_per_hour": 500},
        {"name": "Paddy Harvester", "type": "Harvesting Equipment", "price_per_hour": 450},
        {"name": "Maize Harvester", "type": "Harvesting Equipment", "price_per_hour": 400},
        {"name": "Sugarcane Harvester", "type": "Harvesting Equipment", "price_per_hour": 600},

        # Tillage Equipment
        {"name": "Rotavator", "type": "Tillage Equipment", "price_per_hour": 150},
        {"name": "Disc Harrow", "type": "Tillage Equipment", "price_per_hour": 120},
        {"name": "Cultivator", "type": "Tillage Equipment", "price_per_hour": 100},
        {"name": "Subsoiler", "type": "Tillage Equipment", "price_per_hour": 180},

        # Sowing Equipment
        {"name": "Seed Drill Machine", "type": "Sowing Equipment", "price_per_hour": 200},
        {"name": "Rice Transplanter", "type": "Sowing Equipment", "price_per_hour": 350},
        {"name": "Potato Planter", "type": "Sowing Equipment", "price_per_hour": 250},
        {"name": "Zero Till Seed Drill", "type": "Sowing Equipment", "price_per_hour": 220},

        # Spraying Equipment
        {"name": "Crop Sprayer", "type": "Spraying Equipment", "price_per_hour": 100},
        {"name": "Boom Sprayer", "type": "Spraying Equipment", "price_per_hour": 150},
        {"name": "Drone Sprayer", "type": "Spraying Equipment", "price_per_hour": 400},
        {"name": "Knapsack Power Sprayer", "type": "Spraying Equipment", "price_per_hour": 80},

        # Tillers
        {"name": "Power Tiller", "type": "Tiller", "price_per_hour": 120},
        {"name": "Mini Power Tiller", "type": "Tiller", "price_per_hour": 90},
        {"name": "Conoweeder", "type": "Tiller", "price_per_hour": 70},
    ]

    added = 0
    skipped = 0

    for item in sample_equipment:
        # Check if equipment with same name already exists
        existing = await collection.find_one({"name": item["name"]})
        if existing:
            skipped += 1
        else:
            await collection.insert_one(item)
            added += 1

    print(f"✅ Added {added} new equipment items to MongoDB!")
    if skipped > 0:
        print(f"⏭️  Skipped {skipped} items (already exist)")
    print(f"📊 Total equipment in database: {await collection.count_documents({})}")
    print("🌾 Refresh your browser — equipment will now show up.")

asyncio.run(add_sample_equipment())
