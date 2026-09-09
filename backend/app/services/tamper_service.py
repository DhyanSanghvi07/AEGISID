from app.constants import CheckStatus, Scenario
from app.schemas.verification import CheckResult


class TamperService:
    def analyze(self, scenario: Scenario | None, enabled: bool = True) -> CheckResult:
        if not enabled:
            return CheckResult(
                status=CheckStatus.NOT_CHECKED,
                reason="Tamper analysis is disabled in settings.",
                simulated=True,
            )
        if scenario == Scenario.GENUINE:
            return CheckResult(
                status=CheckStatus.PASS,
                confidence=0.94,
                reason="Simulated document integrity check found no manipulation.",
                simulated=True,
                details={"tamper_score": 0.08},
            )
        if scenario == Scenario.SUSPICIOUS:
            return CheckResult(
                status=CheckStatus.WARNING,
                confidence=0.62,
                reason="Possible document image manipulation detected.",
                simulated=True,
                details={"tamper_score": 0.62},
            )
        if scenario == Scenario.FAKE:
            return CheckResult(
                status=CheckStatus.FAIL,
                confidence=0.12,
                reason="Simulated analysis found strong signs of document manipulation.",
                simulated=True,
                details={"tamper_score": 0.88},
            )
        return CheckResult(
            status=CheckStatus.NOT_CHECKED,
            reason="Tamper analysis is simulated and not forensic-grade in this prototype.",
            simulated=True,
        )


tamper_service = TamperService()
