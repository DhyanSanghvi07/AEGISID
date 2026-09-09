from app.constants import CheckStatus, Decision, DEFAULT_AMBER_MAX, DEFAULT_GREEN_MAX, RiskLevel
from app.schemas.verification import VerificationChecks


def classify(score: int, green_max: int = DEFAULT_GREEN_MAX, amber_max: int = DEFAULT_AMBER_MAX) -> RiskLevel:
    if score <= green_max:
        return RiskLevel.GREEN
    if score <= amber_max:
        return RiskLevel.AMBER
    return RiskLevel.RED


def decision_for(level: RiskLevel) -> Decision:
    if level == RiskLevel.GREEN:
        return Decision.FAST_PASS
    if level == RiskLevel.AMBER:
        return Decision.HUMAN_REVIEW
    return Decision.ALERT_LOCKOUT


def apply_overrides(checks: VerificationChecks, level: RiskLevel) -> tuple[RiskLevel, str | None]:
    face_fail = checks.face.status == CheckStatus.FAIL
    liveness_fail = checks.liveness.status == CheckStatus.FAIL
    tamper_fail = checks.tamper.status == CheckStatus.FAIL
    mrz_fail = checks.mrz.status == CheckStatus.FAIL
    nfc_fail = checks.nfc.status == CheckStatus.FAIL

    if face_fail and liveness_fail:
        return RiskLevel.RED, "Override: face and liveness both failed."
    if face_fail and tamper_fail:
        return RiskLevel.RED, "Override: face mismatch combined with tamper failure."
    if mrz_fail and nfc_fail and tamper_fail:
        return RiskLevel.RED, "Override: MRZ, NFC, and tamper checks all failed."
    return level, None


def decide(
    score: int,
    checks: VerificationChecks,
    green_max: int = DEFAULT_GREEN_MAX,
    amber_max: int = DEFAULT_AMBER_MAX,
) -> tuple[RiskLevel, Decision, str | None]:
    level = classify(score, green_max, amber_max)
    level, override_reason = apply_overrides(checks, level)
    return level, decision_for(level), override_reason
