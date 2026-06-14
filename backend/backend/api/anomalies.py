from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth.dependencies import require_roles
from backend.database.models import AccessLog
from backend.database.session import get_db
from backend.ml.engine import calculate_anomaly_score_for_log
from backend.schemas.entities import AccessLogOut

router = APIRouter()

@router.get("/", response_model=list[AccessLogOut])
async def list_anomalies(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user=Depends(require_roles(["Admin", "SOC Analyst", "Manager", "Auditor"])),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(AccessLog).order_by(AccessLog.created_at.desc()).limit(limit).offset(offset))
    logs = result.scalars().all()
    for log in logs:
        log.anomaly_score = await calculate_anomaly_score_for_log(log)
    return logs

@router.post("/score")
async def score_access_log(log_id: int, db: AsyncSession = Depends(get_db), current_user=Depends(require_roles(["Admin", "SOC Analyst", "Manager"]))):
    result = await db.execute(select(AccessLog).where(AccessLog.id == log_id))
    log = result.scalar_one_or_none()
    if not log:
        return {"error": "Log not found"}
    log.anomaly_score = await calculate_anomaly_score_for_log(log)
    await db.commit()
    await db.refresh(log)
    return log
