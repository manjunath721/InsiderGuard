from datetime import datetime
from sqlalchemy import Boolean, Column, DateTime, Enum, Float, ForeignKey, Integer, JSON, LargeBinary, String, Text, UniqueConstraint
from sqlalchemy.orm import DeclarativeBase, Mapped, relationship

class Base(DeclarativeBase):
    pass

class MetadataDescriptor:
    def __init__(self, attribute_name):
        self.attribute_name = attribute_name

    def __get__(self, instance, owner):
        if instance is None:
            return Base.metadata
        return getattr(instance, self.attribute_name)

    def __set__(self, instance, value):
        setattr(instance, self.attribute_name, value)

class Role(Base):
    __tablename__ = "roles"
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    name: Mapped[str] = Column(String(64), unique=True, nullable=False)
    description: Mapped[str | None] = Column(String(256))
    permissions: Mapped[list["Permission"]] = relationship("Permission", back_populates="role", cascade="all, delete-orphan")

    def __str__(self):
        return self.name

class Permission(Base):
    __tablename__ = "permissions"
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    role_id: Mapped[int] = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)
    resource: Mapped[str] = Column(String(128), nullable=False)
    action: Mapped[str] = Column(String(64), nullable=False)
    role: Mapped[Role] = relationship("Role", back_populates="permissions")
    __table_args__ = (UniqueConstraint("role_id", "resource", "action", name="uniq_role_permission"),)

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    username: Mapped[str] = Column(String(128), unique=True, index=True, nullable=False)
    email: Mapped[str] = Column(String(256), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = Column(String(256), nullable=False)
    full_name: Mapped[str | None] = Column(String(128))
    is_active: Mapped[bool] = Column(Boolean, default=True)
    role_id: Mapped[int | None] = Column(Integer, ForeignKey("roles.id"), nullable=True)
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at: Mapped[datetime] = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    role: Mapped[Role | None] = relationship("Role")
    investigations: Mapped[list["Investigation"]] = relationship("Investigation", back_populates="user")
    chat_sessions: Mapped[list["ChatSession"]] = relationship("ChatSession", back_populates="user")

class AccessLog(Base):
    __tablename__ = "access_logs"
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    username: Mapped[str] = Column(String(128), index=True)
    role: Mapped[str] = Column(String(64))
    department: Mapped[str] = Column(String(128))
    resource: Mapped[str] = Column(String(256))
    action: Mapped[str] = Column(String(128))
    ip_address: Mapped[str] = Column(String(64))
    location: Mapped[str] = Column(String(128))
    device: Mapped[str] = Column(String(256))
    records_accessed: Mapped[int] = Column(Integer)
    session_duration: Mapped[int] = Column(Integer)
    anomaly_score: Mapped[float | None] = Column(Float, default=None)
    risk_score: Mapped[float | None] = Column(Float, default=None)
    log_metadata: Mapped[dict | None] = Column("metadata", JSON)

    metadata = MetadataDescriptor("log_metadata")

    created_at: Mapped[datetime] = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)

class Alert(Base):
    __tablename__ = "alerts"
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    access_log_id: Mapped[int | None] = Column(Integer, ForeignKey("access_logs.id", ondelete="SET NULL"), nullable=True)
    user_id: Mapped[int | None] = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    username: Mapped[str] = Column(String(128), nullable=False)
    severity: Mapped[str] = Column(String(32), nullable=False)
    risk_score: Mapped[int] = Column(Integer, nullable=False)
    title: Mapped[str] = Column(String(256), nullable=False)
    description: Mapped[str] = Column(Text, nullable=False)
    status: Mapped[str] = Column(String(32), nullable=False, default="open")
    recommendations: Mapped[dict] = Column(JSON, nullable=False, default=list)
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    resolved_at: Mapped[datetime | None] = Column(DateTime(timezone=True), nullable=True)
    assigned_to: Mapped[str | None] = Column(String(128), nullable=True)
    access_log: Mapped[AccessLog | None] = relationship("AccessLog")

class Investigation(Base):
    __tablename__ = "investigations"
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    alert_id: Mapped[int | None] = Column(Integer, ForeignKey("alerts.id", ondelete="SET NULL"), nullable=True)
    user_id: Mapped[int | None] = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    summary: Mapped[str] = Column(String(512), nullable=False)
    risk_explanation: Mapped[str] = Column(Text, nullable=False)
    root_cause: Mapped[str] = Column(Text, nullable=False)
    recommendations: Mapped[dict] = Column(JSON, nullable=False, default=list)
    status: Mapped[str] = Column(String(32), nullable=False, default="pending")
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)
    completed_at: Mapped[datetime | None] = Column(DateTime(timezone=True), nullable=True)
    ai_report: Mapped[str | None] = Column(Text, nullable=True)
    user: Mapped[User | None] = relationship("User", back_populates="investigations")
    alert: Mapped[Alert | None] = relationship("Alert")

class RiskScore(Base):
    __tablename__ = "risk_scores"
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    score: Mapped[int] = Column(Integer, nullable=False)
    category: Mapped[str] = Column(String(32), nullable=False)
    explanation: Mapped[str] = Column(Text, nullable=False)
    factors: Mapped[dict] = Column(JSON, nullable=False, default=list)
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)

class BehaviorProfile(Base):
    __tablename__ = "behavior_profiles"
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    baseline: Mapped[dict] = Column(JSON, nullable=False, default={})
    last_updated: Mapped[datetime] = Column(DateTime(timezone=True), default=datetime.utcnow)

class AuditTrail(Base):
    __tablename__ = "audit_trails"
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    user_id: Mapped[int | None] = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action: Mapped[str] = Column(String(256), nullable=False)
    details: Mapped[dict | None] = Column(JSON)
    ip_address: Mapped[str | None] = Column(String(64), nullable=True)
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), default=datetime.utcnow)

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    user_id: Mapped[int | None] = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    session_name: Mapped[str] = Column(String(256), nullable=False)
    created_at: Mapped[datetime] = Column(DateTime(timezone=True), default=datetime.utcnow)
    messages: Mapped[list["ChatMessage"]] = relationship("ChatMessage", back_populates="session", cascade="all, delete-orphan")
    user: Mapped[User | None] = relationship("User", back_populates="chat_sessions")

class ChatMessage(Base):
    __tablename__ = "chat_messages"
    id: Mapped[int] = Column(Integer, primary_key=True, index=True)
    session_id: Mapped[int] = Column(Integer, ForeignKey("chat_sessions.id", ondelete="CASCADE"), nullable=False)
    role: Mapped[str] = Column(String(32), nullable=False)
    msg_metadata: Mapped[dict | None] = Column("metadata", JSON)

    metadata = MetadataDescriptor("msg_metadata")

    created_at: Mapped[datetime] = Column(DateTime(timezone=True), default=datetime.utcnow)
    session: Mapped[ChatSession] = relationship("ChatSession", back_populates="messages")
