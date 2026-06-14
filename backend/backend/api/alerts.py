from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth.dependencies import require_roles
from backend.database.models import Alert, AccessLog
from backend.database.session import get_db
from backend.schemas.entities import AlertOut

router = APIRouter()

@router.get("/", response_model=list[AlertOut])
async def list_alerts(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    status_filter: str | None = None,
    severity: str | None = None,
    query: str | None = None,
    current_user=Depends(require_roles(["Admin", "SOC Analyst", "Manager", "Auditor"])),
    db: AsyncSession = Depends(get_db),
):
    q = select(Alert).order_by(Alert.created_at.desc()).limit(limit).offset(offset)
    if status_filter:
        q = q.where(Alert.status == status_filter)
    if severity:
        q = q.where(Alert.severity == severity)
    if query:
        q = q.where(Alert.username.ilike(f"%{query}%") | Alert.title.ilike(f"%{query}%"))
    return (await db.execute(q)).scalars().all()

@router.post("/", response_model=AlertOut, status_code=status.HTTP_201_CREATED)
async def create_alert(alert: AlertOut, current_user=Depends(require_roles(["Admin", "SOC Analyst", "Manager"])), db: AsyncSession = Depends(get_db)):
    access_log = None
    if alert.access_log_id:
        result = await db.execute(select(AccessLog).where(AccessLog.id == alert.access_log_id))
        access_log = result.scalar_one_or_none()
    new_alert = Alert(**alert.model_dump(exclude={"id", "created_at", "resolved_at"}))
    db.add(new_alert)
    await db.commit()
    await db.refresh(new_alert)
    return new_alert

@router.patch("/{alert_id}/status", response_model=AlertOut)
async def update_alert_status(alert_id: int, status: str, current_user=Depends(require_roles(["Admin", "SOC Analyst", "Manager"])), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Alert).where(Alert.id == alert_id))
    alert = result.scalar_one_or_none()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")
    alert.status = status
    if status == "resolved":
        from datetime import datetime
        alert.resolved_at = datetime.utcnow()
    await db.commit()
    await db.refresh(alert)
    return alert
