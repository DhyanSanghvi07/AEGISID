from app.constants import (
    CheckStatus,
    RISK_WEIGHTS,
    RiskLevel,
    WARNING_WEIGHT_RATIO,
)
from app.schemas.settings import RuntimeSettings
from app.schemas.verification import CheckResult, RiskReason, RiskResult, VerificationChecks
from app.services.decision_service import decide


def _impact_for(status: CheckStatus, weight: int) -> int:
    if status == CheckStatus.FAIL:
        return weight
    if status == CheckStatus.WARNING:
        return round(weight * WARNING_WEIGHT_RATIO)
    return 0


def _severity(impact: int, weight: int) -> str:
    if impact >= weight:
        return "HIGH"
    if impact > 0:
        return "MEDIUM"
    return "LOW"


class RiskService:
    def score(self, checks: VerificationChecks, settings: RuntimeSettings | None = None) -> RiskResult:
        settings = settings or RuntimeSettings()
        contributions: list[RiskReason] = []
        passed: list[str] = []
        failed: list[str] = []
        total = 0

        named_checks: list[tuple[str, CheckResult]] = [
            ("mrz", checks.mrz),
            ("document_consistency", checks.document_consistency),
            ("face", checks.face),
            ("liveness", checks.liveness),
            ("nfc", checks.nfc),
            ("tamper", checks.tamper),
        ]
        for name, check in named_checks:
            weight = RISK_WEIGHTS[name]
            impact = _impact_for(check.status, weight)
            total += impact
            if check.status == CheckStatus.PASS:
                passed.append(name)
            elif check.status == CheckStatus.FAIL:
                failed.append(name)
            if impact > 0:
                contributions.append(
                    RiskReason(
                        check=name,
                        impact=impact,
                        severity=_severity(impact, weight),
                        message=check.reason,
                    )
                )

        score = max(0, min(100, int(round(total))))
        level, decision, override_reason = decide(score, checks, settings.green_max, settings.amber_max)
        if override_reason:
            contributions.append(
                RiskReason(
                    check="override",
                    impact=0,
                    severity="HIGH",
                    message=override_reason,
                )
            )
            if level == RiskLevel.RED and score <= settings.amber_max:
                score = min(100, settings.amber_max + 1)
        return RiskResult(
            score=score,
            level=level,
            decision=decision,
            reasons=contributions,
            passed_checks=passed,
            failed_checks=failed,
        )


risk_service = RiskService()
