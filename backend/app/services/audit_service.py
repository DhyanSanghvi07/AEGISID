from app.repositories.audit_repository import audit_repository
from app.schemas.audit import AuditIntegrityResult, AuditLog
from app.utils.masking import mask_passport_number


class AuditService:
    def record_login(self, actor: str) -> AuditLog:
        return audit_repository.append(actor=actor, action="LOGIN", event_data={"actor": actor})

    def record_logout(self, actor: str) -> AuditLog:
        return audit_repository.append(actor=actor, action="LOGOUT", event_data={"actor": actor})

    def record_verification(self, actor: str, result) -> AuditLog:
        return audit_repository.append(
            actor=actor,
            action="VERIFICATION_COMPLETED",
            verification_id=result.verification_id,
            event_data={
                "verification_id": result.verification_id,
                "officer_id": result.officer_id,
                "scenario": result.metadata.scenario,
                "score": result.risk.score,
                "level": result.risk.level,
                "decision": result.risk.decision,
                "passport_number_masked": mask_passport_number(result.document.passport_number),
            },
        )

    def record_settings_update(self, actor: str, settings: dict) -> AuditLog:
        return audit_repository.append(
            actor=actor,
            action="SETTINGS_UPDATED",
            event_data={"settings": settings},
        )

    def list_logs(self) -> list[AuditLog]:
        return audit_repository.list_logs()

    def get(self, audit_id: str) -> AuditLog | None:
        return audit_repository.get(audit_id)

    def verify_integrity(self) -> AuditIntegrityResult:
        return audit_repository.verify_integrity()


audit_service = AuditService()
