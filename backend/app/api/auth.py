from fastapi import APIRouter, Depends, HTTPException, status

from app.core.deps import get_current_user
from app.core.security import authenticate_user, create_access_token
from app.repositories.settings_repository import settings_repository
from app.schemas.auth import LoginRequest, TokenResponse, User
from app.services.audit_service import audit_service

router = APIRouter()


@router.post("/auth/login", response_model=TokenResponse)
async def login(payload: LoginRequest):
    user = authenticate_user(payload.username, payload.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials.")
    runtime = settings_repository.load()
    token = create_access_token(user, timeout_minutes=runtime.session_timeout_minutes)
    audit_service.record_login(user["username"])
    return TokenResponse(
        access_token=token,
        user=User(username=user["username"], role=user["role"], officer_id=user["officer_id"]),
    )


@router.get("/auth/me", response_model=User)
async def me(current_user: dict = Depends(get_current_user)):
    return User(
        username=current_user["username"],
        role=current_user["role"],
        officer_id=current_user["officer_id"],
    )


@router.post("/auth/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    audit_service.record_logout(current_user["username"])
    return {"ok": True}
