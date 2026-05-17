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
        {"name": "Mahindra 575 Tractor", "type": "Tractor", "price_per_hour": 250, "image_url": "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400"},
        {"name": "John Deere 5050D Tractor", "type": "Tractor", "price_per_hour": 350, "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"},
        {"name": "Sonalika 60 Tractor", "type": "Tractor", "price_per_hour": 300, "image_url": "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400"},
        {"name": "TAFE 45 DI Tractor", "type": "Tractor", "price_per_hour": 220, "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"},
        {"name": "Eicher 380 Tractor", "type": "Tractor", "price_per_hour": 200, "image_url": "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400"},

        # Harvesting Equipment
        {"name": "Combine Harvester", "type": "Harvesting Equipment", "price_per_hour": 500, "image_url": "https://images.unsplash.com/photo-1530267981375-f0de937f5f13?w=400"},
        {"name": "Paddy Harvester", "type": "Harvesting Equipment", "price_per_hour": 450, "image_url": "https://images.unsplash.com/photo-1530267981375-f0de937f5f13?w=400"},
        {"name": "Maize Harvester", "type": "Harvesting Equipment", "price_per_hour": 400, "image_url": "https://images.unsplash.com/photo-1530267981375-f0de937f5f13?w=400"},
        {"name": "Sugarcane Harvester", "type": "Harvesting Equipment", "price_per_hour": 600, "image_url": "https://images.unsplash.com/photo-1530267981375-f0de937f5f13?w=400"},

        # Tillage Equipment
        {"name": "Rotavator", "type": "Tillage Equipment", "price_per_hour": 150, "image_url": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400"},
        {"name": "Disc Harrow", "type": "Tillage Equipment", "price_per_hour": 120, "image_url": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400"},
        {"name": "Cultivator", "type": "Tillage Equipment", "price_per_hour": 100, "image_url": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400"},
        {"name": "Subsoiler", "type": "Tillage Equipment", "price_per_hour": 180, "image_url": "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400"},

        # Sowing Equipment
        {"name": "Seed Drill Machine", "type": "Sowing Equipment", "price_per_hour": 200, "image_url": "https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=400"},
        {"name": "Rice Transplanter", "type": "Sowing Equipment", "price_per_hour": 350, "image_url": "https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=400"},
        {"name": "Potato Planter", "type": "Sowing Equipment", "price_per_hour": 250, "image_url": "https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=400"},
        {"name": "Zero Till Seed Drill", "type": "Sowing Equipment", "price_per_hour": 220, "image_url": "https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?w=400"},

        # Spraying Equipment
        {"name": "Crop Sprayer", "type": "Spraying Equipment", "price_per_hour": 100, "image_url": "https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=400"},
        {"name": "Boom Sprayer", "type": "Spraying Equipment", "price_per_hour": 150, "image_url": "https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=400"},
        {"name": "Drone Sprayer", "type": "Spraying Equipment", "price_per_hour": 400, "image_url": "https://images.unsplash.com/photo-1473968512647-3e447244af8f?w=400"},
        {"name": "Knapsack Power Sprayer", "type": "Spraying Equipment", "price_per_hour": 80, "image_url": "https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=400"},

        # Tillers
        {"name": "Power Tiller", "type": "Tiller", "price_per_hour": 120, "image_url": "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400"},
        {"name": "Mini Power Tiller", "type": "Tiller", "price_per_hour": 90, "image_url": "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400"},
        {"name": "Conoweeder", "type": "Tiller", "price_per_hour": 70, "image_url": "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=400"},
    ]
    added = 0
    skipped = 0

    for item in sample_equipment:
        # Check if equipment with same name already exists
        existing = await collection.find_one({"name": item["name"]})
        if existing:
            await collection.update_one({"name": item["name"]}, {"$set": {"image_url": item["image_url"]}})
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
