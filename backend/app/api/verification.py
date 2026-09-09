from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from typing import Optional

from app.constants import Role, Scenario
from app.core.deps import get_current_user, require_roles
from app.repositories.settings_repository import settings_repository
from app.schemas.verification import DashboardStats, HistoryRecord, VerificationChecks, VerificationResult
from app.services.face_service import face_service
from app.services.liveness_service import liveness_service
from app.services.mrz_service import mrz_service
from app.services.nfc_service import nfc_service
from app.services.ocr_service import ocr_service
from app.services.risk_service import risk_service
from app.services.tamper_service import tamper_service
from app.services.verification_service import verification_service
from app.utils.files import validate_upload


router = APIRouter()


def _parse_scenario(value: str | None) -> Scenario | None:
    if not value:
        return None
    try:
        return Scenario(value.lower())
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid scenario. Use genuine, suspicious, or fake.")


async def _read_image(file: UploadFile | None) -> bytes | None:
    if file is None:
        return None
    contents = await file.read()
    validate_upload(file, contents)
    return contents


@router.post("/upload-document")
async def upload_document(
    file: UploadFile = File(...),
    scenario: str | None = Form(default=None),
    current_user: dict = Depends(require_roles(Role.ADMIN, Role.OFFICER)),
):
    contents = await _read_image(file)
    document, check, groq_used = ocr_service.extract(contents, _parse_scenario(scenario))
    return {
        "document": document.model_dump(),
        "ocr": check.model_dump(),
        "groq_used": groq_used,
    }


@router.post("/mrz/verify")
async def verify_mrz(
    data: dict,
    current_user: dict = Depends(require_roles(Role.ADMIN, Role.OFFICER)),
):
    scenario = _parse_scenario(data.get("scenario"))
    return mrz_service.validate(str(data.get("mrz") or ""), scenario).model_dump()


@router.post("/nfc/verify")
async def verify_nfc(
    data: dict | None = None,
    current_user: dict = Depends(require_roles(Role.ADMIN, Role.OFFICER)),
):
    data = data or {}
    runtime = settings_repository.load()
    return nfc_service.verify(_parse_scenario(data.get("scenario")), enabled=runtime.enable_nfc).model_dump()


@router.post("/tamper/analyze")
async def analyze_tamper(
    file: UploadFile | None = File(default=None),
    scenario: str | None = Form(default=None),
    current_user: dict = Depends(require_roles(Role.ADMIN, Role.OFFICER)),
):
    runtime = settings_repository.load()
    if file is not None:
        await _read_image(file)
    return tamper_service.analyze(_parse_scenario(scenario), enabled=runtime.enable_tamper_detection).model_dump()


@router.post("/face/match")
async def match_face(
    passportImage: UploadFile | None = File(default=None),
    faceImage: UploadFile | None = File(default=None),
    scenario: str | None = Form(default=None),
    current_user: dict = Depends(require_roles(Role.ADMIN, Role.OFFICER)),
):
    if passportImage is not None:
        await _read_image(passportImage)
    face_bytes = await _read_image(faceImage) if faceImage is not None else None
    return face_service.match(_parse_scenario(scenario), has_face_image=bool(face_bytes)).model_dump()


@router.post("/liveness")
async def check_liveness(
    file: UploadFile | None = File(default=None),
    scenario: str | None = Form(default=None),
    current_user: dict = Depends(require_roles(Role.ADMIN, Role.OFFICER)),
):
    runtime = settings_repository.load()
    if file is not None:
        await _read_image(file)
    return liveness_service.check(_parse_scenario(scenario), enabled=runtime.enable_liveness).model_dump()


@router.post("/risk-score")
async def calculate_risk(
    data: dict,
    current_user: dict = Depends(require_roles(Role.ADMIN, Role.OFFICER)),
):
    try:
        checks = VerificationChecks.model_validate(data.get("checks") or data)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid checks payload.") from exc
    runtime = settings_repository.load()
    return risk_service.score(checks, runtime).model_dump()


@router.post("/verification", response_model=VerificationResult)
async def complete_verification(
    scenario: str | None = Form(default=None),
    document: UploadFile | None = File(default=None),
    face_image: UploadFile | None = File(default=None),
    current_user: dict = Depends(require_roles(Role.ADMIN, Role.OFFICER)),
):
    document_bytes = await _read_image(document) if document is not None else None
    face_bytes = await _read_image(face_image) if face_image is not None else None
    if document_bytes is None and _parse_scenario(scenario) is None:
        raise HTTPException(status_code=400, detail="A document image or demo scenario is required.")
    return verification_service.run(
        officer_id=current_user["officer_id"],
        scenario=_parse_scenario(scenario),
        document_bytes=document_bytes,
        face_bytes=face_bytes,
        actor=current_user["username"],
    )


@router.get("/history", response_model=list[HistoryRecord])
async def get_history(current_user: dict = Depends(require_roles(Role.ADMIN, Role.OFFICER))):
    return verification_service.history()


@router.get("/history/{verification_id}", response_model=VerificationResult)
async def get_history_item(
    verification_id: str,
    current_user: dict = Depends(require_roles(Role.ADMIN, Role.OFFICER)),
):
    result = verification_service.get(verification_id)
    if not result:
        raise HTTPException(status_code=404, detail="Verification not found.")
    return result


@router.get("/dashboard", response_model=DashboardStats)
async def dashboard(current_user: dict = Depends(require_roles(Role.ADMIN, Role.OFFICER))):
    return verification_service.dashboard()
