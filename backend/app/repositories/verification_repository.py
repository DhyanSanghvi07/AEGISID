import json
from pathlib import Path

from app.core.config import BACKEND_ROOT
from app.schemas.verification import VerificationResult
from app.utils.serialization import canonical_dumps

STORE_PATH = BACKEND_ROOT / "data" / "verifications.json"


class VerificationRepository:
    def _read_all(self) -> list[dict]:
        if not STORE_PATH.exists():
            return []
        try:
            return json.loads(STORE_PATH.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return []

    def _write_all(self, records: list[dict]) -> None:
        STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
        STORE_PATH.write_text(json.dumps(records, indent=2, default=str), encoding="utf-8")

    def save(self, result: VerificationResult) -> VerificationResult:
        records = self._read_all()
        records.append(json.loads(canonical_dumps(result.model_dump(mode="json"))))
        self._write_all(records)
        return result

    def list_all(self) -> list[VerificationResult]:
        return [VerificationResult.model_validate(item) for item in self._read_all()]

    def get(self, verification_id: str) -> VerificationResult | None:
        for item in self._read_all():
            if item.get("verification_id") == verification_id:
                return VerificationResult.model_validate(item)
        return None


verification_repository = VerificationRepository()
