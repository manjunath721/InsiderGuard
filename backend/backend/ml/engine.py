import os
import pickle
from typing import Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database.models import AccessLog, BehaviorProfile
from backend.database.session import AsyncSessionLocal

MODEL_DIR = os.getenv("MODEL_DIR", "/models")

async def calculate_anomaly_score_for_log(log: AccessLog) -> float:
    baseline_value = 0.0
    if log.user_id:
        baseline = await _load_behavior_baseline(log.user_id)
        if baseline:
            baseline_value = _baseline_penalty(log, baseline)
    score = min(1.0, max(0.0, (log.records_accessed / 100000) + (log.session_duration / 36000) + baseline_value))
    return round(score, 4)

async def _load_behavior_baseline(user_id: int) -> dict[str, Any] | None:
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(BehaviorProfile).where(BehaviorProfile.user_id == user_id))
        profile = result.scalar_one_or_none()
    return profile.baseline if profile else None


def _baseline_penalty(log: AccessLog, baseline: dict[str, Any]) -> float:
    penalty = 0.0
    if baseline.get("normal_locations") and log.location not in baseline["normal_locations"]:
        penalty += 0.15
    if baseline.get("normal_devices") and log.device not in baseline["normal_devices"]:
        penalty += 0.15
    hour = int(log.metadata.get("hour", 0)) if log.metadata else log.session_duration
    if baseline.get("normal_login_hours"):
        start, end = baseline["normal_login_hours"]
        if hour < start or hour > end:
            penalty += 0.2
    return penalty

async def train_models(logs: list[AccessLog], session: AsyncSession) -> None:
    # Model training disabled to minimize package size. 
    # Anomaly scores are calculated using the rule-based approach in calculate_anomaly_score_for_log.
    pass

async def get_behavior_baseline(user_id: int) -> dict[str, Any] | None:
    return await _load_behavior_baseline(user_id)
