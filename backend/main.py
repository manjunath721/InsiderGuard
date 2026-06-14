import asyncio
import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from prometheus_fastapi_instrumentator import Instrumentator

from backend.api import auth, users, access_logs, alerts, risk_score, investigation, chat, reports, anomalies
from backend.database.session import init_db
from backend.database.seed import ensure_seeding
from backend.kafka.consumer import start_consumer
from backend.ai.rag import build_rag_index

app = FastAPI(
    title="InsiderGuard AI Platform API",
    description="Enterprise insider threat detection backend with RBAC, real-time ingestion, ML, RAG, and reporting.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:3000", "http://127.0.0.1:3000",
        "http://localhost:3001", "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(TrustedHostMiddleware, allowed_hosts=["localhost", "127.0.0.1"])

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(access_logs.router, prefix="/api/access-logs", tags=["access-logs"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["alerts"])
app.include_router(risk_score.router, prefix="/api/risk-score", tags=["risk-score"])
app.include_router(investigation.router, prefix="/api/investigation", tags=["investigation"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])
app.include_router(anomalies.router, prefix="/api/anomalies", tags=["anomalies"])

Instrumentator().instrument(app).expose(app)


consumer_task: asyncio.Task | None = None
rag_task: asyncio.Task | None = None

@app.on_event("startup")
async def on_startup():
    await init_db()
    await ensure_seeding()

    if os.getenv("ENABLE_KAFKA_CONSUMER", "true").lower() in ("1", "true", "yes"):
        global consumer_task
        consumer_task = asyncio.create_task(start_consumer())
    if os.getenv("ENABLE_RAG_INDEX", "true").lower() in ("1", "true", "yes"):
        global rag_task
        rag_task = asyncio.create_task(build_rag_index())

@app.on_event("shutdown")
async def on_shutdown():
    if consumer_task and not consumer_task.done():
        consumer_task.cancel()
    if rag_task and not rag_task.done():
        rag_task.cancel()

@app.get("/api/health", tags=["health"])
async def health_check():
    return {"status": "ok", "service": "insiderguard-backend"}
