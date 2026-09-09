from app.constants import CheckStatus, Scenario
from app.schemas.verification import CheckResult, DocumentData
from app.services.mrz_service import parse_td3


def _norm(value: str | None) -> str:
    return (value or "").strip().upper().replace(" ", "")


class DocumentService:
    def check_consistency(self, document: DocumentData, scenario: Scenario | None = None) -> CheckResult:
        if scenario == Scenario.GENUINE:
            return CheckResult(
                status=CheckStatus.PASS,
                confidence=0.97,
                reason="Visual-zone fields are consistent with MRZ data.",
                simulated=True,
            )
        if scenario == Scenario.SUSPICIOUS:
            return CheckResult(
                status=CheckStatus.WARNING,
                confidence=0.62,
                reason="Visual-zone and MRZ values are only partially consistent.",
                simulated=True,
            )
        if scenario == Scenario.FAKE:
            return CheckResult(
                status=CheckStatus.FAIL,
                confidence=0.2,
                reason="Document fields conflict across extraction sources.",
                simulated=True,
            )

        parsed = parse_td3(document.mrz or "")
        mismatches: list[str] = []
        comparisons = {
            "passport_number": (document.passport_number, parsed.get("passport_number")),
            "date_of_birth": (document.date_of_birth, parsed.get("date_of_birth")),
            "expiry_date": (document.expiry_date, parsed.get("expiry_date")),
            "nationality": (document.nationality, parsed.get("nationality")),
            "full_name": (document.full_name, parsed.get("full_name")),
        }
        compared = 0
        for field, (left, right) in comparisons.items():
            if not left or not right:
                continue
            compared += 1
            if _norm(str(left)) != _norm(str(right)):
                mismatches.append(field)

        if compared == 0:
            return CheckResult(
                status=CheckStatus.WARNING,
                confidence=0.5,
                reason="Insufficient overlapping fields to confirm document consistency.",
                simulated=False,
                details={"mismatches": mismatches},
            )
        if mismatches:
            status = CheckStatus.FAIL if len(mismatches) >= 2 else CheckStatus.WARNING
            return CheckResult(
                status=status,
                confidence=0.35 if status == CheckStatus.FAIL else 0.6,
                reason="Extracted values do not fully agree across OCR and MRZ.",
                simulated=False,
                details={"mismatches": mismatches},
            )
        return CheckResult(
            status=CheckStatus.PASS,
            confidence=0.95,
            reason="Visual-zone fields are consistent with MRZ data.",
            simulated=False,
            details={"mismatches": []},
        )


document_service = DocumentService()
