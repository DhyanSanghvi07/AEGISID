from fastapi import APIRouter, Depends, HTTPException

from app.constants import Role
from app.core.deps import require_roles
from app.repositories.audit_repository import audit_repository
from app.schemas.audit import AuditLog
from app.services.audit_service import audit_service

router = APIRouter()


@router.get("/audit-logs", response_model=list[AuditLog])
async def get_audit_logs(current_user: dict = Depends(require_roles(Role.ADMIN))):
    return audit_service.list_logs()


@router.post("/audit-log", response_model=AuditLog)
async def create_audit_log(data: dict, current_user: dict = Depends(require_roles(Role.ADMIN))):
    return audit_repository.append(
        actor=current_user["username"],
        action=str(data.get("action") or "MANUAL_EVENT"),
        verification_id=data.get("verification_id"),
        event_data=data.get("event_data") or data,
    )


@router.get("/audit-log/{log_id}", response_model=AuditLog)
async def get_audit_log(log_id: str, current_user: dict = Depends(require_roles(Role.ADMIN))):
    log = audit_service.get(log_id)
    if not log:
        raise HTTPException(status_code=404, detail="Audit log not found.")
    return log


@router.get("/audit-integrity")
async def verify_audit_integrity(current_user: dict = Depends(require_roles(Role.ADMIN))):
    return audit_service.verify_integrity()
