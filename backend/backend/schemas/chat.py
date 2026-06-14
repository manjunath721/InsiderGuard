from pydantic import BaseModel

class ChatRequest(BaseModel):
    session_id: int | None = None
    query: str

class ChatResponse(BaseModel):
    session_id: int
    query: str
    response: str
    source_documents: list[dict] = []
