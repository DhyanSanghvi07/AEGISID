from datetime import datetime, timezone
from time import perf_counter

from app.constants import Scenario
from app.repositories.settings_repository import settings_repository
from app.repositories.verification_repository import verification_repository
from app.schemas.verification import (
    DashboardStats,
    HistoryRecord,
    VerificationChecks,
    VerificationMetadata,
    VerificationResult,
)
from app.services.audit_service import audit_service
from app.services.document_service import document_service
from app.services.face_service import face_service
from app.services.liveness_service import liveness_service
from app.services.mrz_service import mrz_service
from app.services.nfc_service import nfc_service
from app.services.ocr_service import ocr_service
from app.services.risk_service import risk_service
from app.services.tamper_service import tamper_service
from app.utils.masking import mask_passport_number


class VerificationService:
    def run(
        self,
        officer_id: str,
        scenario: Scenario | None,
        document_bytes: bytes | None,
        face_bytes: bytes | None,
        actor: str,
    ) -> VerificationResult:
        started = perf_counter()
        runtime = settings_repository.load()
        document, ocr_check, groq_used = ocr_service.extract(document_bytes, scenario)
        mrz_check = mrz_service.validate(document.mrz or "", scenario)
        consistency = document_service.check_consistency(document, scenario)
        face_check = face_service.match(scenario, has_face_image=bool(face_bytes))
        liveness_check = liveness_service.check(scenario, enabled=runtime.enable_liveness)
        nfc_check = nfc_service.verify(scenario, enabled=runtime.enable_nfc)
        tamper_check = tamper_service.analyze(scenario, enabled=runtime.enable_tamper_detection)

        checks = VerificationChecks(
            ocr=ocr_check,
            mrz=mrz_check,
            document_consistency=consistency,
            face=face_check,
            liveness=liveness_check,
            nfc=nfc_check,
            tamper=tamper_check,
        )
        risk = risk_service.score(checks, runtime)
        now = datetime.now(timezone.utc)
        result = VerificationResult(
            verification_id=f"VER-{now.strftime('%Y%m%d%H%M%S%f')}",
            timestamp=now,
            officer_id=officer_id,
            document=document,
            checks=checks,
            risk=risk,
            metadata=VerificationMetadata(
                scenario=scenario,
                prototype=True,
                processing_time_ms=int((perf_counter() - started) * 1000),
                groq_used=groq_used,
            ),
        )
        verification_repository.save(result)
        if runtime.enable_audit_logging:
            audit_service.record_verification(actor, result)
        return result

    def history(self) -> list[HistoryRecord]:
        records = []
        for item in reversed(verification_repository.list_all()):
            records.append(
                HistoryRecord(
                    verification_id=item.verification_id,
                    timestamp=item.timestamp,
                    officer_id=item.officer_id,
                    scenario=item.metadata.scenario,
                    full_name=item.document.full_name,
                    passport_number_masked=mask_passport_number(item.document.passport_number),
                    score=item.risk.score,
                    level=item.risk.level,
                    decision=item.risk.decision,
                )
            )
        return records

    def get(self, verification_id: str) -> VerificationResult | None:
        return verification_repository.get(verification_id)

    def dashboard(self) -> DashboardStats:
        items = verification_repository.list_all()
        today = datetime.now(timezone.utc).date()
        green = sum(1 for item in items if item.risk.level.value == "GREEN")
        amber = sum(1 for item in items if item.risk.level.value == "AMBER")
        red = sum(1 for item in items if item.risk.level.value == "RED")
        today_count = sum(1 for item in items if item.timestamp.date() == today)
        history = self.history()
        return DashboardStats(
            total_verifications=len(items),
            green_count=green,
            amber_count=amber,
            red_count=red,
            today_count=today_count,
            recent=history[:8],
            high_risk_alerts=[item for item in history if item.level.value == "RED"][:8],
        )


verification_service = VerificationService()
