from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt

from app.constants import DEMO_USERS, Role
from app.core.config import get_settings


def authenticate_user(username: str, password: str) -> dict | None:
    record = DEMO_USERS.get(username)
    if not record or record["password"] != password:
        return None
    return {
        "username": username,
        "role": record["role"],
        "officer_id": record["officer_id"],
    }


def create_access_token(user: dict, timeout_minutes: int | None = None) -> str:
    settings = get_settings()
    expire_minutes = timeout_minutes or settings.session_timeout_minutes
    expire = datetime.now(timezone.utc) + timedelta(minutes=expire_minutes)
    payload = {
        "sub": user["username"],
        "role": str(user["role"]),
        "officer_id": user["officer_id"],
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> dict:
    settings = get_settings()
    data = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    role = Role(data["role"])
    return {
        "username": data["sub"],
        "role": role,
        "officer_id": data["officer_id"],
    }


def token_error_message(exc: JWTError) -> str:
    return str(exc) or "Invalid or expired session."
