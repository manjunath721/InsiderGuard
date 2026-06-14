import os
import httpx
from typing import Any
from sqlalchemy import select

from backend.database.models import AccessLog, Alert, Investigation
from backend.database.session import AsyncSessionLocal

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

async def generate_chat_response(query: str, user_id: int) -> dict[str, Any]:
    # 1. Retrieve local context from SQLite database using SQLAlchemy
    # We fetch the latest alerts and access logs to provide relevance context
    async with AsyncSessionLocal() as session:
        alert_result = await session.execute(
            select(Alert).order_by(Alert.created_at.desc()).limit(5)
        )
        alerts = alert_result.scalars().all()
        
        log_result = await session.execute(
            select(AccessLog).order_by(AccessLog.created_at.desc()).limit(5)
        )
        logs = log_result.scalars().all()

    context_lines = []
    context_lines.append("Recent Alerts in System:")
    for a in alerts:
        context_lines.append(f"- Alert: {a.title} | Severity: {a.severity.upper()} | User: {a.username} | Status: {a.status}")
    
    context_lines.append("\nRecent Access Logs:")
    for l in logs:
        context_lines.append(f"- Log: {l.username} accessed {l.resource} ({l.action}) | Risk: {l.risk_score} | Time: {l.created_at}")

    context_text = "\n".join(context_lines)

    # 2. Return helper response if OpenAI API key is missing
    if not OPENAI_API_KEY:
        offline_message = (
            "**Offline Mode**: OpenAI API key is not configured in `.env`.\n\n"
            "Here is the local system context retrieved from the database:\n\n"
            f"```\n{context_text}\n```\n\n"
            "To enable active generative AI chat responses, please add `OPENAI_API_KEY=your_key` to `backend/.env` and restart the servers."
        )
        return {
            "response": offline_message,
            "source_documents": []
        }

    # 3. Call OpenAI Chat Completions API directly via httpx
    headers = {
        "Authorization": f"Bearer {OPENAI_API_KEY}",
        "Content-Type": "application/json"
    }
    
    system_prompt = (
        "You are InsiderGuard AI, a security operations center analyst. "
        "Help the user investigate security incidents and answer questions based on the following local context "
        "retrieved from the platform database:\n\n"
        f"{context_text}"
    )
    
    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": query}
        ],
        "temperature": 0.2
    }

    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                json=payload,
                headers=headers,
                timeout=30.0
            )
            response.raise_for_status()
            data = response.json()
            answer = data["choices"][0]["message"]["content"]
            return {"response": answer, "source_documents": []}
    except Exception as e:
        return {
            "response": f"Failed to connect to OpenAI API: {str(e)}.\n\n**Local Context:**\n\n{context_text}",
            "source_documents": []
        }

async def build_rag_index() -> None:
    # Vector DB / Chroma index building is deprecated to minimize application size.
    # Context is now loaded dynamically from the SQLite database.
    pass
