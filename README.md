# 🌾 KrushiSaathi — AI-Based Farmer Assistant Platform

KrushiSaathi is a final year project — an AI-powered platform to assist Indian farmers with crop advice, government schemes, fertilizer guidance, and agricultural equipment rental.

---

## 📌 Features

- 🤖 **AI Chatbot** — Multilingual farming assistant (Hindi, Marathi, English) powered by Groq LLM + RAG
- 🎙️ **Voice Chat** — Talk to the assistant using your voice
- 🚜 **Equipment Rental System** — Farmers can browse and book equipment; Vendors can list their equipment
- 🌿 **Crop Health** — Upload crop images and get disease detection
- 💊 **Fertilizer Advisor** — Get fertilizer recommendations based on crop and soil
- 📋 **Government Schemes** — Browse relevant government schemes for farmers

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + TypeScript + Vite + Tailwind CSS + shadcn/ui |
| Backend | Python + FastAPI + Uvicorn |
| Database | MongoDB Atlas (Cloud) |
| AI/LLM | Groq API (Llama 3.1) + RAG with FAISS |
| Speech | Whisper (STT) + gTTS (TTS) |
| Embeddings | HuggingFace sentence-transformers |

---

## 📁 Project Structure

```
Final-Year-Project-/
  backend/
    routers/          — API route handlers
    services/         — Business logic
    models/           — Pydantic schemas
    utils/            — Config and helpers
    data/             — RAG knowledge base
    static/           — Uploaded images
    main.py           — FastAPI entry point
    requirements.txt  — Python dependencies
  Frontend/
    src/
      pages/          — React pages
      components/     — UI components
      services/       — API call functions
      contexts/       — React context providers
    package.json      — Node dependencies
```

---

## ⚙️ Setup & Installation

### Prerequisites
Install these before starting:
- [Node.js LTS](https://nodejs.org) — for frontend
- [Python 3.11](https://www.python.org/downloads) — for backend (check "Add to PATH" during install)
- [Git](https://git-scm.com/download/win) — for cloning
- [VS Code](https://code.visualstudio.com) — recommended editor

---

### Step 1 — Clone the repository
```bash
git clone https://github.com/nil2411/Final-Year-Project-.git
cd Final-Year-Project-
```

---

### Step 2 — Backend Setup

```bash
cd backend
python -m venv venv
```

**Activate virtual environment:**

Windows:
```bash
venv\Scripts\activate
```

Mac/Linux:
```bash
source venv/bin/activate
```

**Install dependencies:**
```bash
pip install -r requirements.txt
pip install motor
```

**Create `.env` file** inside `backend/` folder:
```
GROQ_API_KEY=your_groq_api_key_here
MONGO_URI=your_mongodb_atlas_connection_string
HOST=0.0.0.0
PORT=8000
DEBUG=true
```

> 🔑 Get your Groq API key free at: https://console.groq.com/keys
> 🗄️ Get MongoDB Atlas connection string at: https://cloud.mongodb.com

---

### Step 3 — Frontend Setup

```bash
cd Frontend
npm install
```

**Create `.env` file** inside `Frontend/` folder:
```
VITE_API_BASE_URL=http://localhost:8000
```

---

### Step 4 — Run the Project

Open **two terminals** and run:

**Terminal 1 — Backend:**
```bash
cd backend
venv\Scripts\activate    # Windows
python main.py
```

You should see:
```
✅ KrishiBot Backend ready!
INFO: Uvicorn running on http://0.0.0.0:8000
```

**Terminal 2 — Frontend:**
```bash
cd Frontend
npm run dev
```

You should see:
```
VITE ready in xxx ms
➜ Local: http://localhost:5173/
```

---

### Step 5 — Open in Browser

```
http://localhost:5173
```

---

## 🚜 Equipment Rental Module

The rental module is accessible at:
```
http://localhost:5173/rental
```

### As a Farmer:
1. Select **"I am a Farmer"**
2. Browse equipment by category
3. Click any equipment to see availability calendar
4. Select dates (red = booked, green = available)
5. Set start/end time and confirm booking

### As a Vendor:
1. Select **"I am a Vendor"**
2. Click **"Add Equipment"** to list your equipment
3. Fill name, type, price and upload an image
4. View all bookings made on your equipment

### Add Sample Equipment (First Time Only):
```bash
cd backend
python add_equipment.py
```

---

## 🌐 API Endpoints

### AI Chat
| Method | Endpoint | Description |
|---|---|---|
| POST | /api/chat | Send text message to AI |
| POST | /api/voice-chat | Send voice message |
| GET | /api/languages | Get supported languages |
| GET | /health | Health check |

### Equipment Rental
| Method | Endpoint | Description |
|---|---|---|
| GET | /api/rental/equipment | Get all equipment |
| POST | /api/rental/book | Create booking |
| GET | /api/rental/bookings | Get active bookings |
| GET | /api/rental/bookings/history | Get booking history |
| DELETE | /api/rental/book/{id} | Cancel booking |
| GET | /api/rental/vendor/equipment | Get vendor equipment |
| POST | /api/rental/vendor/equipment | Add equipment |
| PUT | /api/rental/vendor/equipment/{id} | Update equipment |
| DELETE | /api/rental/vendor/equipment/{id} | Delete equipment |
| GET | /api/rental/vendor/bookings | Get vendor bookings |
| GET | /api/rental/equipment/{id}/availability | Get availability |

---

## 📖 API Documentation

FastAPI provides automatic interactive API docs:
```
http://localhost:8000/docs
```

---

## ⚠️ Important Notes

- The MongoDB Atlas database is shared across all team members
- All team members must create their own `.env` file with the shared credentials

---

## 👥 Team

Final Year Project — KrushiSaathi
Department of Information Technology

---

## 📄 License

This project is for educational purposes only.
