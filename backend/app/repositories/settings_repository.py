import json
from pathlib import Path

from app.core.config import BACKEND_ROOT, get_settings
from app.schemas.settings import RuntimeSettings

SETTINGS_PATH = BACKEND_ROOT / "data" / "settings.json"


class SettingsRepository:
    def load(self) -> RuntimeSettings:
        env = get_settings()
        defaults = RuntimeSettings(
            session_timeout_minutes=env.session_timeout_minutes,
            groq_enabled=env.groq_enabled,
            groq_model=env.groq_model,
            demo_mode=env.demo_mode,
            green_max=env.green_max,
            amber_max=env.amber_max,
            max_upload_size_mb=env.max_upload_size_mb,
        )
        if not SETTINGS_PATH.exists():
            return defaults
        try:
            stored = json.loads(SETTINGS_PATH.read_text(encoding="utf-8"))
            merged = defaults.model_dump()
            merged.update(stored)
            return RuntimeSettings.model_validate(merged)
        except Exception:
            return defaults

    def save(self, settings: RuntimeSettings) -> RuntimeSettings:
        if settings.green_max >= settings.amber_max:
            raise ValueError("GREEN threshold must be lower than AMBER threshold.")
        SETTINGS_PATH.parent.mkdir(parents=True, exist_ok=True)
        SETTINGS_PATH.write_text(settings.model_dump_json(indent=2), encoding="utf-8")
        return settings


settings_repository = SettingsRepository()
