from pydantic import BaseModel, Field


class RuntimeSettings(BaseModel):
    session_timeout_minutes: int = Field(default=30, ge=5, le=120)
    groq_enabled: bool = False
    groq_model: str = "llama-3.3-70b-versatile"
    demo_mode: bool = True
    green_max: int = Field(default=30, ge=0, le=100)
    amber_max: int = Field(default=70, ge=0, le=100)
    max_upload_size_mb: int = Field(default=10, ge=1, le=50)
    enable_nfc: bool = True
    enable_liveness: bool = True
    enable_tamper_detection: bool = True
    enable_audit_logging: bool = True
