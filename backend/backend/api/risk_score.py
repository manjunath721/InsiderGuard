from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.auth.dependencies import require_roles
from backend.database.models import RiskScore
from backend.database.session import get_db
from backend.schemas.entities import RiskScoreOut

router = APIRouter()

@router.get("/", response_model=list[RiskScoreOut])
async def list_risk_scores(current_user=Depends(require_roles(["Admin", "SOC Analyst", "Manager", "Auditor"])), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RiskScore).order_by(RiskScore.created_at.desc()))
    return result.scalars().all()

@router.get("/user/{user_id}", response_model=list[RiskScoreOut])
async def user_risk_history(user_id: int, current_user=Depends(require_roles(["Admin", "SOC Analyst", "Manager", "Auditor"])), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(RiskScore).where(RiskScore.user_id == user_id).order_by(RiskScore.created_at.desc()))
    return result.scalars().all()
