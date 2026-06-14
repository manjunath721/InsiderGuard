from datetime import datetime
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database.models import BehaviorProfile, AccessLog

async def compute_baseline_for_user(user_id: int, db: AsyncSession) -> dict:
    result = await db.execute(select(AccessLog).where(AccessLog.user_id == user_id))
    logs = result.scalars().all()
    if not logs:
        return {}
    normal_locations = sorted({log.location for log in logs})[:5]
    normal_devices = sorted({log.device for log in logs})[:5]
    hours = [log.created_at.hour for log in logs]
    return {
        "normal_login_hours": [min(hours), max(hours)],
        "normal_locations": normal_locations,
        "normal_devices": normal_devices,
        "avg_download_volume": sum(log.records_accessed for log in logs) // len(logs),
        "avg_session_duration": sum(log.session_duration for log in logs) // len(logs),
        "last_updated": datetime.utcnow().isoformat(),
    }

async def update_behavior_profile(user_id: int, db: AsyncSession) -> BehaviorProfile | None:
    baseline = await compute_baseline_for_user(user_id, db)
    if not baseline:
        return None
    result = await db.execute(select(BehaviorProfile).where(BehaviorProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if profile:
        profile.baseline = baseline
        profile.last_updated = datetime.utcnow()
    else:
        profile = BehaviorProfile(user_id=user_id, baseline=baseline)
        db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile
