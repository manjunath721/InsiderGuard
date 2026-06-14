from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from sqlalchemy.orm import selectinload
from backend.auth.dependencies import get_current_user, require_roles
from backend.database.models import User
from backend.database.session import get_db
from backend.schemas.entities import UserOut

router = APIRouter()

@router.get("/", response_model=list[UserOut])
async def list_users(current_user=Depends(require_roles(["Admin", "SOC Analyst", "Manager", "Auditor"])), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).order_by(User.username).options(selectinload(User.role)))
    return result.scalars().all()

@router.get("/{user_id}", response_model=UserOut)
async def get_user(user_id: int, current_user=Depends(require_roles(["Admin", "SOC Analyst", "Manager", "Auditor"])), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id).options(selectinload(User.role)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

@router.put("/{user_id}/deactivate", response_model=UserOut)
async def deactivate_user(user_id: int, current_user=Depends(require_roles(["Admin", "Manager"])), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.id == user_id).options(selectinload(User.role)))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.is_active = False
    await db.commit()
    await db.refresh(user)
    return user
