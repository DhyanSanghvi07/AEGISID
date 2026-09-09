from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class AuditLog(BaseModel):
    audit_id: str
    timestamp: datetime
    actor: str
    action: str
    verification_id: str | None = None
    event_data: dict[str, Any] = Field(default_factory=dict)
    previous_hash: str
    current_hash: str


class AuditIntegrityResult(BaseModel):
    valid: bool
    checked_records: int
    first_invalid_record: int | None = None
