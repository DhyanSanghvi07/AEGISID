from app.constants import CheckStatus, Scenario
from app.schemas.verification import CheckResult


class NfcService:
    """Simulated e-passport chip check. Replace later with PC/SC + BAC/PACE."""

    def verify(self, scenario: Scenario | None, enabled: bool = True) -> CheckResult:
        if not enabled:
            return CheckResult(
                status=CheckStatus.NOT_CHECKED,
                reason="NFC verification is disabled in settings.",
                simulated=True,
                details={"chip_detected": False, "certificate_valid": False},
            )
        if scenario == Scenario.GENUINE:
            return CheckResult(
                status=CheckStatus.PASS,
                confidence=0.95,
                reason="Simulated e-passport chip verification passed.",
                simulated=True,
                details={"chip_detected": True, "certificate_valid": True},
            )
        if scenario in (Scenario.SUSPICIOUS, Scenario.FAKE):
            return CheckResult(
                status=CheckStatus.FAIL,
                confidence=0.2,
                reason="Simulated passport chip verification failed.",
                simulated=True,
                details={"chip_detected": scenario == Scenario.SUSPICIOUS, "certificate_valid": False},
            )
        return CheckResult(
            status=CheckStatus.NOT_CHECKED,
            reason="NFC hardware is not connected in this prototype.",
            simulated=True,
            details={"chip_detected": False, "certificate_valid": False},
        )


nfc_service = NfcService()
