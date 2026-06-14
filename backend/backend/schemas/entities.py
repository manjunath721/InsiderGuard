from datetime import datetime
from pydantic import BaseModel, field_validator

class UserOut(BaseModel):
    id: int
    username: str
    email: str
    full_name: str | None
    role: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True

    @field_validator('role', mode='before')
    @classmethod
    def serialize_role(cls, v):
        if v is not None and not isinstance(v, str):
            return getattr(v, 'name', str(v))
        return v

class RoleOut(BaseModel):
    id: int
    name: str
    description: str | None

    class Config:
        orm_mode = True

class AccessLogOut(BaseModel):
    id: int
    user_id: int | None
    username: str
    role: str
    department: str
    resource: str
    action: str
    ip_address: str
    location: str
    device: str
    records_accessed: int
    session_duration: int
    anomaly_score: float | None
    risk_score: float | None
    metadata: dict | None
    created_at: datetime

    class Config:
        orm_mode = True

class AlertOut(BaseModel):
    id: int
    access_log_id: int | None
    user_id: int | None
    username: str
    severity: str
    risk_score: int
    title: str
    description: str
    status: str
    recommendations: list[str]
    created_at: datetime
    resolved_at: datetime | None
    assigned_to: str | None

    class Config:
        orm_mode = True

class InvestigationOut(BaseModel):
    id: int
    alert_id: int | None
    user_id: int | None
    summary: str
    risk_explanation: str
    root_cause: str
    recommendations: list[str]
    status: str
    created_at: datetime
    completed_at: datetime | None
    ai_report: str | None

    class Config:
        orm_mode = True

class RiskScoreOut(BaseModel):
    id: int
    user_id: int
    score: int
    category: str
    explanation: str
    factors: list[dict]
    created_at: datetime

    class Config:
        orm_mode = True

class BehaviorProfileOut(BaseModel):
    id: int
    user_id: int
    baseline: dict
    last_updated: datetime

    class Config:
        orm_mode = True

class ChatMessageOut(BaseModel):
    id: int
    session_id: int
    role: str
    content: str
    metadata: dict | None
    created_at: datetime

    class Config:
        orm_mode = True

class ChatSessionOut(BaseModel):
    id: int
    user_id: int | None
    session_name: str
    created_at: datetime
    messages: list[ChatMessageOut] = []

    class Config:
        orm_mode = True

class ReportOut(BaseModel):
    generated_at: datetime
    report_type: str
    file_url: str
    metadata: dict | None
