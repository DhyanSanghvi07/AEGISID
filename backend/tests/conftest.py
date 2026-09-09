import json
from pathlib import Path

import pytest

from app.core.config import get_settings
from app.repositories import audit_repository as audit_repo_module
from app.repositories import settings_repository as settings_repo_module
from app.repositories import verification_repository as verification_repo_module


@pytest.fixture(autouse=True)
def isolated_storage(tmp_path, monkeypatch):
    monkeypatch.setenv("GROQ_ENABLED", "false")
    monkeypatch.setenv("GROQ_API_KEY", "")
    get_settings.cache_clear()

    data_dir = tmp_path / "data"
    audit_dir = tmp_path / "audit_logs"
    data_dir.mkdir()
    audit_dir.mkdir()

    monkeypatch.setattr(verification_repo_module, "STORE_PATH", data_dir / "verifications.json")
    monkeypatch.setattr(settings_repo_module, "SETTINGS_PATH", data_dir / "settings.json")
    monkeypatch.setattr(audit_repo_module, "AUDIT_DIR", audit_dir)
    monkeypatch.setattr(audit_repo_module, "INDEX_PATH", audit_dir / "_index.json")
    yield
    get_settings.cache_clear()
