"""
Chat router - Handles text-based chat requests
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Request
from typing import Optional
import base64
import json
import re
from pathlib import Path

from models.schemas import ChatRequest, ChatResponse, ChatMessage, Source, InputRate
#from models.rental_schemas import ChatRequest, ChatResponse, ChatMessage, Source, InputRate
from services.llm_service import llm_service
from services.rag_service import rag_service
from services.tts_service import tts_service
from services.memory_service import memory_service
from utils.language_utils import validate_language, detect_language, normalize_language_code
from utils.config import BACKEND_DIR

router = APIRouter(prefix="/api", tags=["chat"])


@router.post("/chat", response_model=ChatResponse)
async def chat(request: Request):
    """
    Main chat endpoint - accepts text query (and optionally image) and returns response with audio
    Supports both JSON and multipart/form-data requests
    """
    # Check if LLM is available (Groq primary, GPT4All offline fallback)
    if not llm_service.groq_client and not llm_service.gpt4all_model:
        raise HTTPException(
            status_code=503,
            detail="LLM service is not available. Please check if GROQ_API_KEY is set in your .env file, or install GPT4All for offline mode. Visit /health for more details."
        )
    
    try:
        content_type = request.headers.get("content-type", "")
        
        # Handle multipart/form-data (with optional image)
        if "multipart/form-data" in content_type:
            form = await request.form()
            
            user_query = form.get("query", "")
            lang = form.get("language", "hi")
            use_rag_flag = form.get("use_rag", "true").lower() == "true"
            conv_id = form.get("conversation_id")
            temp = float(form.get("temperature", "0.7"))
            image = form.get("image")
            
            # Parse conversation history if provided (as JSON string)
            conversation_history = None
            history_str = form.get("conversation_history")
            if history_str:
                try:
                    history_data = json.loads(history_str) if isinstance(history_str, str) else history_str
                    conversation_history = [ChatMessage(**msg) for msg in history_data]
                except (json.JSONDecodeError, TypeError, ValueError):
                    # If parsing fails, continue without history
                    pass
            
            # Handle image upload
            image_data = None
            image_file = None
            if image and isinstance(image, UploadFile):
                image_file = image
                # Save image to static folder
                image_dir = BACKEND_DIR / "static" / "images"
                image_dir.mkdir(parents=True, exist_ok=True)
                
                # Generate unique filename
                import uuid
                file_ext = Path(image.filename).suffix if image.filename else ".jpg"
                image_filename = f"{uuid.uuid4()}{file_ext}"
                image_path = image_dir / image_filename
                
                # Save image
                image_content = await image.read()
                with open(image_path, "wb") as f:
                    f.write(image_content)
                
                # Encode for potential LLM use
                image_data = base64.b64encode(image_content).decode('utf-8')
        else:
            # Handle JSON request
            body = await request.json()
            chat_request = ChatRequest(**body)
            
            user_query = chat_request.query
            lang = chat_request.language
            use_rag_flag = chat_request.use_rag
            conv_id = chat_request.conversation_id
            temp = chat_request.temperature
            image_file = None
            image_data = None
            conversation_history = chat_request.conversation_history
        
        if not user_query and not image_file:
            raise HTTPException(status_code=400, detail="Query or image is required")
        
        # Auto-detect language from query if not provided or invalid
        if not lang or not validate_language(lang):
            detected = detect_language(user_query) if user_query else "hi"
            lang = detected
        else:
            # Even if provided, detect from query to ensure accuracy
            detected = detect_language(user_query) if user_query else lang
            # Use detected language if it differs and is more confident
            if detected != lang and user_query and len(user_query.strip()) > 5:
                lang = detected
        
        # Normalize language code for backend compatibility (gu/pa/ta -> hi/en)
        lang = normalize_language_code(lang)
        
        # Get or prepare conversation history for LLM
        # Use memory service if conversation_id is provided, otherwise use provided history
        history_for_llm = None
        if conv_id:
            # Get history from memory service
            history_for_llm = memory_service.get_conversation_history(conv_id)
            # Convert to dict format if needed
            if history_for_llm and isinstance(history_for_llm[0], dict):
                pass  # Already in correct format
            else:
                history_for_llm = [
                    {"role": msg.get("role", "user"), "content": msg.get("content", "")}
                    for msg in history_for_llm
                ]
        elif conversation_history:
            # Use provided conversation history
            history_for_llm = [
                {"role": msg.role, "content": msg.content}
                for msg in conversation_history
            ]
        
        # Expand query with explicit context from conversation history
        query_text = user_query
        if history_for_llm and len(history_for_llm) > 0:
            # Extract the most recent topic from conversation history
            recent_topic = None
            for msg in reversed(history_for_llm[-6:]):  # Check last 6 messages
                if msg.get("role") == "user":
                    recent_query = msg.get("content", "").strip()
                    # Remove image indicators
                    recent_query = re.sub(r'📷.*\n?', '', recent_query).strip()
                    recent_query = re.sub(r'images?\.(jpeg|jpg|png|gif|webp)\s*', '', recent_query, flags=re.IGNORECASE).strip()
                    
                    # Extract topic from queries like "tell me about X"
                    if "about" in recent_query.lower():
                        parts = recent_query.lower().split("about")
                        if len(parts) > 1:
                            recent_topic = parts[1].strip()
                            # Clean up common words
                            for word in ["the", "a", "an", "some", "more"]:
                                if recent_topic.startswith(word + " "):
                                    recent_topic = recent_topic[len(word)+1:].strip()
                            break
                    # Extract from "what is X" or "what are X"
                    elif "what is" in recent_query.lower() or "what are" in recent_query.lower():
                        parts = recent_query.lower().split("what is" if "what is" in recent_query.lower() else "what are")
                        if len(parts) > 1:
                            recent_topic = parts[1].strip()
                            break
                    # Or just take the query if it's short and seems like a topic
                    elif len(recent_query.split()) <= 5 and len(recent_query.split()) >= 1:
                        # Check if it's not a question
                        if not recent_query.strip().endswith("?"):
                            recent_topic = recent_query
                            break
            
            # Expand query with explicit references
            if recent_topic:
                query_lower = query_text.lower()
                # Replace vague references with explicit topic
                if "more similar" in query_lower or "similar plants" in query_lower or "similar to it" in query_lower:
                    query_text = f"{query_text} (specifically, plants similar to {recent_topic})"
                elif "it" in query_lower and ("similar" in query_lower or "like" in query_lower):
                    query_text = f"{query_text.replace(' it', f' {recent_topic}').replace('it ', f'{recent_topic} ')}"
                elif "this" in query_lower or "that" in query_lower:
                    query_text = f"{query_text} (referring to {recent_topic})"
                elif "more" in query_lower and len(query_text.split()) <= 5:
                    query_text = f"tell me about more {recent_topic} or plants similar to {recent_topic}"
        
        # Build query text (include image info if present)
        if image_file:
            query_text = f"{query_text}\n[Image uploaded: {image_file.filename or 'image'}]" if query_text else f"[Image uploaded: {image_file.filename or 'image'} - Please analyze this image]"
        
        # Retrieve context if RAG is enabled
        if use_rag_flag:
            search_query = query_text or user_query or "भारतीय कृषि मार्गदर्शन"
            context, rag_sources, rag_confidence = rag_service.retrieve(search_query)
        else:
            context, rag_sources, rag_confidence = "NO_DOC_CONTEXT", [], 0.0

        if image_file:
            context = (
                f"{context}\n\n[User uploaded image: {image_file.filename or 'image'}. "
                "Describe visible crop issues, pest damage, or nutrient deficiencies if possible.]"
                if context != "NO_DOC_CONTEXT"
                else "[User uploaded image: analyze for crop stage, disease, or pest hints.]"
            )

        llm_response = await llm_service.generate_response(
            query=query_text or user_query,
            language=lang,
            context=context,
            sources=rag_sources,
            confidence=rag_confidence,
            memory=history_for_llm,
        )
        
        # Generate TTS audio
        audio_url = ""
        if llm_response.get("tts_text"):
            audio_url = await tts_service.generate_speech(
                llm_response["tts_text"],
                lang
            ) or ""
        
        # Update memory service with user query and assistant response
        if conv_id:
            memory_service.add_message(conv_id, "user", user_query)
            response_text = llm_response.get("summary_short", "") or llm_response.get("summary_detailed", "")
            memory_service.add_message(conv_id, "assistant", response_text)
        
        # Convert sources to Source objects
        sources_list = []
        for src in llm_response.get("sources", []):
            if isinstance(src, dict):
                sources_list.append(Source(
                    title=src.get("title", ""),
                    page=str(src.get("page", "")),
                    score=float(src.get("score", 0.0))
                ))
        
        # Convert inputs_and_rates to InputRate objects
        inputs_list = []
        for inp in llm_response.get("inputs_and_rates", []):
            if isinstance(inp, dict):
                inputs_list.append(InputRate(
                    name=inp.get("name", ""),
                    value=inp.get("value", ""),
                    notes=inp.get("notes", "")
                ))
        
        # Build response (new detailed format)
        response = ChatResponse(
            title=llm_response.get("title", ""),
            confidence=llm_response.get("confidence", 0.0),
            summary_short=llm_response.get("summary_short", ""),
            summary_detailed=llm_response.get("summary_detailed", ""),
            timing=llm_response.get("timing", ""),
            inputs_and_rates=inputs_list,
            steps_brief=llm_response.get("steps_brief", []),
            steps_detailed=llm_response.get("steps_detailed", []),
            monitoring_and_signs=llm_response.get("monitoring_and_signs", []),
            urgent_action=llm_response.get("urgent_action", []),
            recommendation=llm_response.get("recommendation", ""),
            regional_adaptations=llm_response.get("regional_adaptations", ""),
            follow_up_questions=llm_response.get("follow_up_questions", []),
            tts_text=llm_response.get("tts_text", ""),
            audio_url=audio_url,
            sources=sources_list,
            notes_for_farmer=llm_response.get("notes_for_farmer", ""),
            language=lang,
            conversation_id=conv_id
        )
        
        return response
    
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Error processing chat request: {str(e)}")

