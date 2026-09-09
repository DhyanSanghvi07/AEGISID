from enum import Enum


class Scenario(str, Enum):
    GENUINE = "genuine"
    SUSPICIOUS = "suspicious"
    FAKE = "fake"


class CheckStatus(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    WARNING = "WARNING"
    NOT_CHECKED = "NOT_CHECKED"


class RiskLevel(str, Enum):
    GREEN = "GREEN"
    AMBER = "AMBER"
    RED = "RED"


class Decision(str, Enum):
    FAST_PASS = "FAST_PASS"
    HUMAN_REVIEW = "HUMAN_REVIEW"
    ALERT_LOCKOUT = "ALERT_LOCKOUT"


class Role(str, Enum):
    ADMIN = "ADMIN"
    OFFICER = "OFFICER"


class ExtractionSource(str, Enum):
    TESSERACT = "tesseract"
    GROQ = "groq"
    LOCAL_PARSER = "local_parser"
    DEMO_FALLBACK = "demo_fallback"
    MRZ = "mrz"


RISK_WEIGHTS = {
    "mrz": 15,
    "document_consistency": 15,
    "face": 20,
    "liveness": 15,
    "nfc": 15,
    "tamper": 20,
}

WARNING_WEIGHT_RATIO = 0.5

DEFAULT_GREEN_MAX = 30
DEFAULT_AMBER_MAX = 70

GENESIS_HASH = "GENESIS"

MAX_UPLOAD_BYTES_DEFAULT = 10 * 1024 * 1024
ALLOWED_IMAGE_MIME_TYPES = {"image/jpeg", "image/jpg", "image/png", "image/webp", "image/bmp"}
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp"}

DEMO_USERS = {
    "admin": {"password": "admin123", "role": Role.ADMIN, "officer_id": "OFF-ADMIN"},
    "officer": {"password": "officer123", "role": Role.OFFICER, "officer_id": "OFF-001"},
}
