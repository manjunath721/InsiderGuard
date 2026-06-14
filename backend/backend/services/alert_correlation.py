from typing import Any
from datetime import datetime, timedelta

from backend.database.models import Alert

def correlate_alerts(alerts: list[Alert]) -> list[dict[str, Any]]:
    correlated: list[dict[str, Any]] = []
    active = [alert for alert in alerts if alert.status != "resolved"]
    user_groups: dict[int | None, list[Alert]] = {}
    for alert in active:
        user_groups.setdefault(alert.user_id, []).append(alert)

    for user_id, group in user_groups.items():
        if len(group) < 2:
            continue
        sorted_group = sorted(group, key=lambda item: item.created_at)
        window = sorted_group[-1].created_at - sorted_group[0].created_at
        if window <= timedelta(hours=4):
            correlated.append({
                "user_id": user_id,
                "alert_count": len(group),
                "severity": max(group, key=lambda item: item.risk_score).severity,
                "created_at": sorted_group[0].created_at,
                "summary": f"{len(group)} correlated alerts for user within {window}.",
                "alert_ids": [alert.id for alert in group],
            })
    return correlated
