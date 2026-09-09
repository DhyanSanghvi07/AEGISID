from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    groq_api_key: str | None = None
    groq_model: str = "llama-3.3-70b-versatile"
    groq_enabled: bool = False

    jwt_secret: str = "aegisid-prototype-secret-change-me"
    jwt_algorithm: str = "HS256"
    session_timeout_minutes: int = 30

    frontend_origin: str = "http://localhost:3000"
    max_upload_size_mb: int = 10

    green_max: int = 30
    amber_max: int = 70

    demo_mode: bool = True

    model_config = SettingsConfigDict(
        env_file=BACKEND_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


def reload_settings() -> Settings:
    get_settings.cache_clear()
    return get_settings()
