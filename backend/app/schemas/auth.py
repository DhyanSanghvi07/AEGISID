from pydantic import BaseModel

from app.constants import Role


class LoginRequest(BaseModel):
    username: str
    password: str


class User(BaseModel):
    username: str
    role: Role
    officer_id: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: User
