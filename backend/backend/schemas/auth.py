from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=128)
    email: EmailStr
    full_name: str | None = None
    password: str = Field(..., min_length=10)
    role: str = Field(..., min_length=3, max_length=64)

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    sub: str
    roles: list[str] | None = None
    exp: int
    type: str | None = None
