from pydantic import BaseModel
from typing import List, Optional

class ChatMessage(BaseModel):
    role: str
    content: str

class Source(BaseModel):
    title: Optional[str] = None
    url: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    language: Optional[str] = "en"

class ChatResponse(BaseModel):
    response: str
    sources: Optional[List[Source]] = []

class InputRate(BaseModel):
    tokens: Optional[int] = 0

class VoiceChatResponse(BaseModel):
    response: str
    transcribed_text: Optional[str] = None
    sources: Optional[List[Source]] = []
    audio_url: Optional[str] = None
    language: Optional[str] = "en"

class LanguageResponse(BaseModel):
    languages: List[str] = ["en", "hi", "mr"]

    