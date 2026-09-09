from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.constants import CheckStatus, Decision, RiskLevel, Scenario


class CheckResult(BaseModel):
    status: CheckStatus
    confidence: float | None = None
    reason: str
    simulated: bool = False
    details: dict[str, Any] = Field(default_factory=dict)


class DocumentData(BaseModel):
    document_type: str = "passport"
    passport_number: str | None = None
    full_name: str | None = None
    date_of_birth: str | None = None
    nationality: str | None = None
    issuing_country: str | None = None
    expiry_date: str | None = None
    mrz: str | None = None
    extraction_confidence: float = 0.0
    extraction_source: str = "local_parser"


class RiskReason(BaseModel):
    check: str
    impact: int
    severity: str
    message: str


class RiskResult(BaseModel):
    score: int
    level: RiskLevel
    decision: Decision
    reasons: list[RiskReason] = Field(default_factory=list)
    passed_checks: list[str] = Field(default_factory=list)
    failed_checks: list[str] = Field(default_factory=list)


class VerificationChecks(BaseModel):
    ocr: CheckResult
    mrz: CheckResult
    document_consistency: CheckResult
    face: CheckResult
    liveness: CheckResult
    nfc: CheckResult
    tamper: CheckResult


class VerificationMetadata(BaseModel):
    scenario: Scenario | None = None
    prototype: bool = True
    processing_time_ms: int = 0
    groq_used: bool = False


class VerificationResult(BaseModel):
    verification_id: str
    timestamp: datetime
    officer_id: str
    document: DocumentData
    checks: VerificationChecks
    risk: RiskResult
    metadata: VerificationMetadata


class HistoryRecord(BaseModel):
    verification_id: str
    timestamp: datetime
    officer_id: str
    scenario: Scenario | None = None
    full_name: str | None = None
    passport_number_masked: str | None = None
    score: int
    level: RiskLevel
    decision: Decision


class DashboardStats(BaseModel):
    total_verifications: int
    green_count: int
    amber_count: int
    red_count: int
    today_count: int
    recent: list[HistoryRecord]
    high_risk_alerts: list[HistoryRecord]
