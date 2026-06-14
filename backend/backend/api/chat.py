from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.auth.dependencies import get_current_user, require_roles
from backend.database.models import ChatSession, ChatMessage, User
from backend.database.session import get_db
from backend.schemas.chat import ChatRequest, ChatResponse
from backend.ai.rag import generate_chat_response

router = APIRouter()

@router.post("/query", response_model=ChatResponse)
async def query_chat(request: ChatRequest, current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    session = None
    if request.session_id:
        result = await db.execute(select(ChatSession).where(ChatSession.id == request.session_id))
        session = result.scalar_one_or_none()
    if not session:
        session = ChatSession(user_id=current_user.id, session_name=f"session-{current_user.id}-{request.query[:24]}")
        db.add(session)
        await db.commit()
        await db.refresh(session)

    chat_response = await generate_chat_response(request.query, current_user.id)
    message = ChatMessage(session_id=session.id, role="assistant", content=chat_response["response"], metadata={"source_documents": chat_response.get("source_documents", [])})
    db.add(message)
    await db.commit()
    await db.refresh(message)
    return {"session_id": session.id, "query": request.query, "response": chat_response["response"], "source_documents": chat_response.get("source_documents", [])}

@router.get("/sessions", response_model=list[int])
async def list_sessions(current_user=Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(ChatSession.id).where(ChatSession.user_id == current_user.id).order_by(ChatSession.created_at.desc()))
    return [r[0] for r in result.all()]
