from app.constants import CheckStatus, Scenario
from app.schemas.verification import CheckResult


class FaceService:
    """Prototype face-match interface. Replace with DeepFace later without changing the workflow."""

    def match(self, scenario: Scenario | None, has_face_image: bool) -> CheckResult:
        if scenario == Scenario.GENUINE:
            return CheckResult(
                status=CheckStatus.PASS,
                confidence=0.96,
                reason="Captured face is consistent with passport photograph.",
                simulated=True,
                details={"similarity": 0.96, "has_face_image": has_face_image},
            )
        if scenario == Scenario.SUSPICIOUS:
            return CheckResult(
                status=CheckStatus.WARNING,
                confidence=0.71,
                reason="Face similarity is inconclusive and requires officer review.",
                simulated=True,
                details={"similarity": 0.71, "has_face_image": has_face_image},
            )
        if scenario == Scenario.FAKE:
            return CheckResult(
                status=CheckStatus.FAIL,
                confidence=0.22,
                reason="Captured face does not match the passport photograph.",
                simulated=True,
                details={"similarity": 0.22, "has_face_image": has_face_image},
            )
        if not has_face_image:
            return CheckResult(
                status=CheckStatus.NOT_CHECKED,
                confidence=None,
                reason="No live face image was provided.",
                simulated=True,
            )
        return CheckResult(
            status=CheckStatus.WARNING,
            confidence=0.5,
            reason="Prototype face matching is simulated and was not bound to a demo scenario.",
            simulated=True,
            details={"similarity": 0.5, "has_face_image": True},
        )


face_service = FaceService()
