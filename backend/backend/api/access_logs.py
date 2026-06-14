from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth.dependencies import require_roles
from backend.database.models import AccessLog, User
from backend.database.session import get_db
from backend.schemas.entities import AccessLogOut

router = APIRouter()

@router.get("/", response_model=list[AccessLogOut])
async def list_access_logs(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    username: str | None = None,
    action: str | None = None,
    severity: str | None = None,
    current_user=Depends(require_roles(["Admin", "SOC Analyst", "Manager", "Auditor"])),
    db: AsyncSession = Depends(get_db),
):
    query = select(AccessLog).order_by(AccessLog.created_at.desc()).limit(limit).offset(offset)
    if username:
        query = query.where(
            (AccessLog.username.ilike(f"%{username}%")) |
            (AccessLog.resource.ilike(f"%{username}%"))
        )
    if action:
        query = query.where(AccessLog.action == action)
    return (await db.execute(query)).scalars().all()

@router.post("/ingest", status_code=status.HTTP_201_CREATED)
async def ingest_access_log(log_payload: AccessLogOut, current_user=Depends(require_roles(["Admin", "SOC Analyst", "Manager"])), db: AsyncSession = Depends(get_db)):
    access_log = AccessLog(**log_payload.model_dump(exclude={"id", "created_at"}))
    db.add(access_log)
    await db.commit()
    await db.refresh(access_log)
    return access_log

@router.get("/user/{user_id}", response_model=list[AccessLogOut])
async def get_user_access_logs(user_id: int, current_user=Depends(require_roles(["Admin", "SOC Analyst", "Manager", "Auditor"])), db: AsyncSession = Depends(get_db)):
    query = select(AccessLog).where(AccessLog.user_id == user_id).order_by(AccessLog.created_at.desc())
    return (await db.execute(query)).scalars().all()
