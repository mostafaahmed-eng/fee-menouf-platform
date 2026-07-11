import logging
from typing import Optional
from pydantic import BaseModel

from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import StreamingResponse

from app.chat.chat_engine import chat_engine, session_store, rate_limiter
from app.utils.rate_limiter import get_rate_limiter

logger = logging.getLogger("ai_engine.api.chat")
router = APIRouter(prefix="/chat", tags=["Chat"])


class ChatRequest(BaseModel):
    message: str
    session_id: str = "default"
    student_data: Optional[dict] = None
    system_prompt: Optional[str] = None


class ChatHistoryResponse(BaseModel):
    session_id: str
    history: list


class SuggestRequest(BaseModel):
    context: Optional[str] = None
    count: int = 4


@router.post("")
async def send_message(request: ChatRequest, req: Request):
    client_host = req.client.host if req.client else "unknown"
    rate_key = f"chat:{client_host}:{request.session_id}"

    limiter = get_rate_limiter()
    if not limiter.check(rate_key):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please wait before sending another message.")

    try:
        result = await chat_engine.send_message(
            query=request.message,
            session_id=request.session_id,
            student_data=request.student_data,
            system_prompt_override=request.system_prompt,
        )
        return result
    except Exception as e:
        logger.error(f"Chat error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stream")
async def stream_chat(request: ChatRequest, req: Request):
    client_host = req.client.host if req.client else "unknown"
    rate_key = f"chat:stream:{client_host}:{request.session_id}"

    limiter = get_rate_limiter()
    if not limiter.check(rate_key):
        raise HTTPException(status_code=429, detail="Rate limit exceeded. Please wait before sending another message.")

    async def event_generator():
        async for event in chat_engine.send_message_stream(
            query=request.message,
            session_id=request.session_id,
            student_data=request.student_data,
        ):
            yield event

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.post("/suggest")
async def get_suggestions(request: SuggestRequest):
    try:
        suggestions = chat_engine.get_suggestions(
            context=request.context,
            count=request.count,
        )
        return {"suggestions": suggestions}
    except Exception as e:
        logger.error(f"Suggest error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{session_id}")
async def get_history(session_id: str):
    try:
        history = session_store.get_history(session_id)
        return {"session_id": session_id, "history": history}
    except Exception as e:
        logger.error(f"History error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/history/{session_id}")
async def clear_history(session_id: str):
    try:
        session_store.clear_history(session_id)
        return {"message": f"History cleared for session {session_id}"}
    except Exception as e:
        logger.error(f"Clear history error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
