from app.constants import CheckStatus, Scenario
from app.schemas.verification import CheckResult


class LivenessService:
    def check(self, scenario: Scenario | None, enabled: bool = True) -> CheckResult:
        if not enabled:
            return CheckResult(
                status=CheckStatus.NOT_CHECKED,
                reason="Liveness detection is disabled in settings.",
                simulated=True,
            )
        if scenario == Scenario.FAKE:
            return CheckResult(
                status=CheckStatus.FAIL,
                confidence=0.18,
                reason="Simulated liveness check failed; presentation attack suspected.",
                simulated=True,
            )
        if scenario in (Scenario.GENUINE, Scenario.SUSPICIOUS):
            return CheckResult(
                status=CheckStatus.PASS,
                confidence=0.93 if scenario == Scenario.GENUINE else 0.88,
                reason="Simulated liveness check passed.",
                simulated=True,
            )
        return CheckResult(
            status=CheckStatus.NOT_CHECKED,
            reason="Liveness is simulated and requires a demo scenario in this prototype.",
            simulated=True,
        )


liveness_service = LivenessService()
