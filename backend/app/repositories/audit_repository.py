import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.constants import GENESIS_HASH
from app.core.config import BACKEND_ROOT
from app.schemas.audit import AuditIntegrityResult, AuditLog
from app.utils.serialization import canonical_dumps

AUDIT_DIR = BACKEND_ROOT / "audit_logs"
INDEX_PATH = AUDIT_DIR / "_index.json"


class AuditRepository:
    def _ensure(self) -> None:
        AUDIT_DIR.mkdir(parents=True, exist_ok=True)

    def _load_index(self) -> list[str]:
        self._ensure()
        if not INDEX_PATH.exists():
            files = sorted(
                path.name
                for path in AUDIT_DIR.glob("AUD-*.json")
            )
            INDEX_PATH.write_text(json.dumps(files), encoding="utf-8")
            return files
        try:
            return json.loads(INDEX_PATH.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            return []

    def _save_index(self, files: list[str]) -> None:
        INDEX_PATH.write_text(json.dumps(files), encoding="utf-8")

    def list_logs(self) -> list[AuditLog]:
        logs: list[AuditLog] = []
        for filename in self._load_index():
            path = AUDIT_DIR / filename
            if not path.exists():
                continue
            try:
                logs.append(AuditLog.model_validate(json.loads(path.read_text(encoding="utf-8"))))
            except Exception:
                continue
        return logs

    def get(self, audit_id: str) -> AuditLog | None:
        path = AUDIT_DIR / f"{audit_id}.json"
        if not path.exists():
            return None
        return AuditLog.model_validate(json.loads(path.read_text(encoding="utf-8")))

    def latest_hash(self) -> str:
        logs = self.list_logs()
        if not logs:
            return GENESIS_HASH
        return logs[-1].current_hash

    def append(
        self,
        actor: str,
        action: str,
        event_data: dict[str, Any],
        verification_id: str | None = None,
    ) -> AuditLog:
        self._ensure()
        previous_hash = self.latest_hash()
        timestamp = datetime.now(timezone.utc)
        audit_id = f"AUD-{timestamp.strftime('%Y%m%d%H%M%S%f')}"
        canonical_event = canonical_dumps(
            {
                "audit_id": audit_id,
                "timestamp": timestamp.isoformat(),
                "actor": actor,
                "action": action,
                "verification_id": verification_id,
                "event_data": event_data,
            }
        )
        current_hash = hashlib.sha256((previous_hash + canonical_event).encode("utf-8")).hexdigest()
        log = AuditLog(
            audit_id=audit_id,
            timestamp=timestamp,
            actor=actor,
            action=action,
            verification_id=verification_id,
            event_data=event_data,
            previous_hash=previous_hash,
            current_hash=current_hash,
        )
        filename = f"{audit_id}.json"
        (AUDIT_DIR / filename).write_text(log.model_dump_json(indent=2), encoding="utf-8")
        index = self._load_index()
        index.append(filename)
        self._save_index(index)
        return log

    def verify_integrity(self) -> AuditIntegrityResult:
        logs = self.list_logs()
        previous = GENESIS_HASH
        for index, log in enumerate(logs, start=1):
            canonical_event = canonical_dumps(
                {
                    "audit_id": log.audit_id,
                    "timestamp": log.timestamp.isoformat(),
                    "actor": log.actor,
                    "action": log.action,
                    "verification_id": log.verification_id,
                    "event_data": log.event_data,
                }
            )
            expected = hashlib.sha256((previous + canonical_event).encode("utf-8")).hexdigest()
            if log.previous_hash != previous or log.current_hash != expected:
                return AuditIntegrityResult(
                    valid=False,
                    checked_records=len(logs),
                    first_invalid_record=index,
                )
            previous = log.current_hash
        return AuditIntegrityResult(valid=True, checked_records=len(logs), first_invalid_record=None)

    def overwrite_log(self, audit_id: str, payload: dict[str, Any]) -> None:
        path = AUDIT_DIR / f"{audit_id}.json"
        path.write_text(json.dumps(payload, indent=2, default=str), encoding="utf-8")


audit_repository = AuditRepository()
