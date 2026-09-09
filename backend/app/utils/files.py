import io
import os
import uuid
from pathlib import Path

from fastapi import HTTPException, UploadFile
from PIL import Image

from app.constants import ALLOWED_IMAGE_EXTENSIONS, ALLOWED_IMAGE_MIME_TYPES
from app.repositories.settings_repository import settings_repository

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads"


def validate_upload(file: UploadFile, contents: bytes) -> None:
    runtime = settings_repository.load()
    max_bytes = runtime.max_upload_size_mb * 1024 * 1024
    if not contents:
        raise HTTPException(status_code=400, detail="No file content received.")
    if len(contents) > max_bytes:
        raise HTTPException(status_code=400, detail=f"File exceeds {runtime.max_upload_size_mb} MB limit.")

    filename = file.filename or "upload.bin"
    extension = Path(filename).suffix.lower()
    if extension and extension not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported file extension.")

    mime = (file.content_type or "").lower()
    if mime and mime not in ALLOWED_IMAGE_MIME_TYPES and mime != "application/octet-stream":
        raise HTTPException(status_code=400, detail="Unsupported image type.")

    try:
        image = Image.open(io.BytesIO(contents))
        image.verify()
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Uploaded file is not a valid image.") from exc


def safe_temp_path(suffix: str = ".jpg") -> Path:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    name = f"{uuid.uuid4().hex}{suffix}"
    return UPLOAD_DIR / name


def cleanup_path(path: Path | None) -> None:
    if path and path.exists():
        try:
            os.remove(path)
        except OSError:
            pass
