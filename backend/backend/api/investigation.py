from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth.dependencies import require_roles
from backend.database.models import Investigation
from backend.database.session import get_db
from backend.schemas.entities import InvestigationOut

router = APIRouter()

@router.get("/", response_model=list[InvestigationOut])
async def list_investigations(current_user=Depends(require_roles(["Admin", "SOC Analyst", "Manager", "Auditor"])), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Investigation).order_by(Investigation.created_at.desc()))
    return result.scalars().all()

@router.get("/{investigation_id}", response_model=InvestigationOut)
async def get_investigation(investigation_id: int, current_user=Depends(require_roles(["Admin", "SOC Analyst", "Manager", "Auditor"])), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Investigation).where(Investigation.id == investigation_id))
    investigation = result.scalar_one_or_none()
    if not investigation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Investigation not found")
    return investigation

@router.patch("/{investigation_id}/status", response_model=InvestigationOut)
async def update_investigation_status(investigation_id: int, status: str, current_user=Depends(require_roles(["Admin", "SOC Analyst", "Manager"])), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Investigation).where(Investigation.id == investigation_id))
    investigation = result.scalar_one_or_none()
    if not investigation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Investigation not found")
    investigation.status = status
    await db.commit()
    await db.refresh(investigation)
    return investigation
