from .auth import router as auth_router
from .users import router as users_router
from .access_logs import router as access_logs_router
from .alerts import router as alerts_router
from .risk_score import router as risk_score_router
from .investigation import router as investigation_router
from .chat import router as chat_router
from .reports import router as reports_router
from .anomalies import router as anomalies_router

__all__ = [
    "auth_router",
    "users_router",
    "access_logs_router",
    "alerts_router",
    "risk_score_router",
    "investigation_router",
    "chat_router",
    "reports_router",
    "anomalies_router",
]
