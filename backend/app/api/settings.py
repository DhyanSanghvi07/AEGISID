from fastapi import APIRouter, Depends, HTTPException

from app.constants import Role
from app.core.deps import require_roles
from app.repositories.settings_repository import settings_repository
from app.schemas.settings import RuntimeSettings
from app.services.audit_service import audit_service

router = APIRouter()


@router.get("/settings", response_model=RuntimeSettings)
async def get_settings_endpoint(current_user: dict = Depends(require_roles(Role.ADMIN))):
    return settings_repository.load()


@router.put("/settings", response_model=RuntimeSettings)
async def update_settings(
    payload: RuntimeSettings,
    current_user: dict = Depends(require_roles(Role.ADMIN)),
):
    try:
        saved = settings_repository.save(payload)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    audit_service.record_settings_update(current_user["username"], saved.model_dump())
    return saved
