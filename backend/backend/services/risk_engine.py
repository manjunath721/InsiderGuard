from typing import Literal

def risk_category(score: int) -> Literal["Low", "Medium", "High", "Critical"]:
    if score >= 76:
        return "Critical"
    if score >= 51:
        return "High"
    if score >= 26:
        return "Medium"
    return "Low"

async def calculate_hybrid_risk_score(ml_score: float, behavior_score: float, threat_indicator_score: float, historical_score: float) -> int:
    hybrid = (ml_score * 0.4 + behavior_score * 0.3 + threat_indicator_score * 0.2 + historical_score * 0.1) * 100
    return int(min(max(hybrid, 0), 100))
