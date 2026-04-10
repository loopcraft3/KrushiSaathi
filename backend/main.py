"""
KrishiBot - FastAPI Backend
AI Chatbot for Farmers with multilingual support
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager
from pathlib import Path

from routers import chat, voice_chat, websocket_chat
from models.schemas import LanguageResponse
from services.llm_service import llm_service
from services.rag_service import rag_service
from utils.config import settings, BACKEND_DIR, ENV_FILE

from routers import rental


# WebSocket connection manager moved to routers/websocket_chat.py


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup/shutdown"""
    # Startup
    print("\n" + "=" * 60)
    print("🚀 KrishiBot Backend Starting...")
    print("=" * 60)
    print(f"📁 Backend Directory: {BACKEND_DIR.absolute()}")
    print(f"📄 Environment File: {ENV_FILE.absolute()}")
    print(f"📄 File Exists: {ENV_FILE.exists()}")
    print()
    print(f"📊 Vector DB: {settings.vector_db}")
    print(f"🤖 LLM Provider: Groq (primary), GPT4All (offline fallback)")
    print(f"🤖 Groq Model: {settings.groq_model}")
    print(f"🔊 TTS Engine: {settings.tts_engine}")
    print(f"🎤 STT Engine: {settings.stt_engine}")
    print()
    
    # Check Groq API key status (PRIMARY)
    if settings.groq_api_key:
        masked_key = settings.groq_api_key[:7] + '...' + settings.groq_api_key[-4:] if len(settings.groq_api_key) > 11 else '***'
        print(f"✅ Groq API Key: {masked_key} (PRIMARY)")
    else:
        print("❌ Groq API Key: NOT FOUND (PRIMARY)")
        print("   → Chat features may not work")
        print(f"   → Please add GROQ_API_KEY to {ENV_FILE}")
        print("   → Get your key from: https://console.groq.com/keys")
    
    # Check GPT4All status (OFFLINE FALLBACK)
    if llm_service.gpt4all_model:
        print("✅ GPT4All: Available (offline fallback)")
    else:
        print("ℹ️  GPT4All: Not available (optional offline fallback)")
        print("   → Install with: pip install gpt4all")
    print()
    
    # Pre-warm services
    print("⏳ Pre-warming services...")
    try:
        # Test RAG
        _, test_sources, test_confidence = rag_service.retrieve("test query")
        print(f"✅ RAG service ready (found {len(test_sources)} test results, confidence: {test_confidence:.2f})")
    except Exception as e:
        print(f"⚠️ RAG service warning: {e}")
    
    print()
    print("=" * 60)
    print("✅ KrishiBot Backend ready!")
    print("=" * 60 + "\n")
    
    yield
    
    # Shutdown
    print("👋 Shutting down KrishiBot Backend...")


# Create FastAPI app
app = FastAPI(
    title="KrishiBot API",
    description="AI Chatbot for Farmers - Multilingual Agriculture Assistant",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for audio
BACKEND_DIR = Path(__file__).parent
app.mount("/static", StaticFiles(directory=str(BACKEND_DIR / "static")), name="static")

# Include routers
app.include_router(chat.router)
app.include_router(voice_chat.router)
app.include_router(websocket_chat.router)
app.include_router(rental.router)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "KrishiBot API - AI Chatbot for Farmers",
        "version": "1.0.0",
        "endpoints": {
            "chat": "/api/chat",
            "voice_chat": "/api/voice-chat",
            "languages": "/api/languages",
            "websocket": "/ws/chat",
            "docs": "/docs"
        }
    }


@app.get("/api/languages", response_model=LanguageResponse)
async def get_languages():
    """Get supported languages"""
    return LanguageResponse()


# WebSocket endpoint is now in routers/websocket_chat.py


@app.get("/health")
async def health_check():
    """Health check endpoint with detailed service status"""
    from pathlib import Path
    from utils.config import BACKEND_DIR, ENV_FILE
    
    env_exists = ENV_FILE.exists()
    groq_key_loaded = settings.groq_api_key is not None and settings.groq_api_key != ""
    
    return {
        "status": "healthy",
        "services": {
            "rag": rag_service.vector_store is not None,
            "llm_groq": llm_service.groq_client is not None,  # PRIMARY
            "llm_gpt4all": llm_service.gpt4all_model is not None,  # OFFLINE FALLBACK
            "llm_available": llm_service.groq_client is not None or llm_service.gpt4all_model is not None,
            "tts": tts_service.tts_engine is not None,
            "stt": stt_service.model is not None
        },
        "configuration": {
            "env_file_exists": env_exists,
            "env_file_path": str(ENV_FILE.absolute()) if env_exists else None,
            "llm_provider": "groq" if groq_key_loaded else ("gpt4all" if llm_service.gpt4all_model else "none"),
            "groq_api_key_loaded": groq_key_loaded,  # PRIMARY
            "groq_model": settings.groq_model,
            "gpt4all_available": llm_service.gpt4all_model is not None,  # OFFLINE FALLBACK
            "backend_directory": str(BACKEND_DIR.absolute())
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )

