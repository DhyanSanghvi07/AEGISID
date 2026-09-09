import io
import os
import re
import shutil
from datetime import datetime
from typing import Any

import numpy as np
from PIL import Image, ImageOps
import pytesseract

from app.constants import CheckStatus, ExtractionSource, Scenario
from app.schemas.verification import CheckResult, DocumentData
from app.services.llm import get_llm_provider
from app.services.mrz_service import mrz_service, parse_td3

try:
    import cv2
    CV2_AVAILABLE = True
except Exception:
    CV2_AVAILABLE = False


def find_tesseract_executable() -> str | None:
    candidates: list[str] = []
    path_value = shutil.which("tesseract")
    if path_value:
        candidates.append(path_value)
    for base_dir in [
        os.environ.get("TESSERACT_PATH"),
        r"C:\Program Files\Tesseract-OCR",
        r"C:\Program Files (x86)\Tesseract-OCR",
    ]:
        if not base_dir:
            continue
        candidates.append(os.path.join(base_dir, "tesseract.exe"))
        candidates.append(os.path.join(base_dir, "tesseract"))
    seen: set[str] = set()
    for candidate in candidates:
        normalized = os.path.normpath(candidate)
        if normalized in seen:
            continue
        seen.add(normalized)
        if os.path.isfile(normalized):
            return normalized
    return None


TESSERACT_EXECUTABLE = find_tesseract_executable()
if TESSERACT_EXECUTABLE:
    pytesseract.pytesseract.tesseract_cmd = TESSERACT_EXECUTABLE


DEMO_DOCUMENTS = {
    Scenario.GENUINE: DocumentData(
        full_name="ALEX TRAVELER",
        passport_number="P1234567",
        date_of_birth="1990-01-15",
        nationality="USA",
        issuing_country="USA",
        expiry_date="2030-01-15",
        mrz="P<USATRAVELER<<ALEX<<<<<<<<<<<<<<<<<<<<<<<\nP1234567<8USA9001157M3001155<<<<<<<<<<<<<<04",
        extraction_confidence=0.91,
        extraction_source=ExtractionSource.DEMO_FALLBACK.value,
    ),
    Scenario.SUSPICIOUS: DocumentData(
        full_name="JORDAN SUSPECT",
        passport_number="X9988776",
        date_of_birth="1988-07-22",
        nationality="GBR",
        issuing_country="GBR",
        expiry_date="2027-03-01",
        mrz="P<GBRSUSPECT<<JORDAN<<<<<<<<<<<<<<<<<<<<<<\nX9988776<0GBR8807224M2703014<<<<<<<<<<<<<<00",
        extraction_confidence=0.82,
        extraction_source=ExtractionSource.DEMO_FALLBACK.value,
    ),
    Scenario.FAKE: DocumentData(
        full_name="RIVER FORGED",
        passport_number="Z0001112",
        date_of_birth="1995-12-01",
        nationality="CAN",
        issuing_country="CAN",
        expiry_date="2026-05-09",
        mrz="P<CANFORGED<<RIVER<<<<<<<<<<<<<<<<<<<<<<<<\nZ0001112<1CAN9512018F2605098<<<<<<<<<<<<<<00",
        extraction_confidence=0.68,
        extraction_source=ExtractionSource.DEMO_FALLBACK.value,
    ),
}


def extract_visual_zone_fields(ocr_text: str) -> dict[str, Any]:
    normalized_text = ocr_text.replace("\r", "\n")
    lines = [line.strip() for line in normalized_text.splitlines() if line.strip()]

    def first_value_after(label_patterns: list[str]) -> str:
        lower_lines = [line.lower() for line in lines]
        for index, line in enumerate(lower_lines):
            if any(pattern in line for pattern in label_patterns):
                for next_line in lines[index + 1: index + 5]:
                    cleaned = re.sub(r"[^A-Za-z0-9/\- ]", "", next_line).strip()
                    if cleaned and not cleaned.lower().startswith(("date", "nationality", "sex", "place")):
                        return cleaned
                break
        return ""

    def extract_date_after(label_patterns: list[str]) -> str | None:
        for index, line in enumerate(lines):
            if any(pattern in line.lower() for pattern in label_patterns):
                for next_line in lines[index + 1: index + 4]:
                    match = re.search(r"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})", next_line)
                    if match:
                        raw = match.group(1)
                        for fmt in ("%d/%m/%Y", "%d-%m-%Y", "%m/%d/%Y"):
                            try:
                                return datetime.strptime(raw, fmt).strftime("%Y-%m-%d")
                            except ValueError:
                                continue
                break
        return None

    name = first_value_after(["given name", "given name(s)", "surname", "name"])
    passport_number = ""
    for index, line in enumerate(lines):
        match = re.search(
            r"(?:passport\s*(?:no\.?|number)|document\s*(?:no\.?|number))\s*[:#-]?\s*([A-Z0-9]{5,})",
            line,
            re.IGNORECASE,
        )
        if match:
            passport_number = match.group(1).upper()
            break
        if "passport" in line.lower() and index + 1 < len(lines):
            candidate = re.sub(r"[^A-Za-z0-9]", "", lines[index + 1]).upper()
            if 5 <= len(candidate) <= 12:
                passport_number = candidate
                break

    return {
        "full_name": name or None,
        "passport_number": passport_number or None,
        "date_of_birth": extract_date_after(["date of birth", "dob"]),
        "nationality": first_value_after(["nationality"]) or None,
        "issuing_country": first_value_after(["issuing", "authority", "country"]) or None,
        "expiry_date": extract_date_after(["date of expiry", "expiry"]),
    }


def _unknown(value: str | None) -> bool:
    return value is None or value in ("", "Unknown", "N/A")


class OcrService:
    def preprocess(self, image_bytes: bytes) -> Image.Image:
        image = Image.open(io.BytesIO(image_bytes))
        if image.mode not in ("RGB", "L"):
            image = image.convert("RGB")
        if CV2_AVAILABLE:
            array = np.array(image)
            if array.ndim == 3:
                gray = cv2.cvtColor(array, cv2.COLOR_RGB2GRAY)
            else:
                gray = array
            gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
            gray = cv2.GaussianBlur(gray, (3, 3), 0)
            processed = cv2.adaptiveThreshold(
                gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 9
            )
            return Image.fromarray(processed)
        image = ImageOps.grayscale(image)
        image = ImageOps.autocontrast(image)
        return image.resize((image.width * 2, image.height * 2))

    def read_text(self, image_bytes: bytes) -> str:
        executable = find_tesseract_executable()
        if not executable:
            raise RuntimeError(
                "Tesseract is not installed or not in PATH. Install Tesseract OCR to enable local OCR."
            )
        pytesseract.pytesseract.tesseract_cmd = executable
        image = self.preprocess(image_bytes)
        return pytesseract.image_to_string(image, config="--psm 6")

    def parse_local(self, ocr_text: str) -> DocumentData:
        mrz = mrz_service.extract_from_text(ocr_text)
        parsed = parse_td3(mrz) if mrz else {}
        visual = extract_visual_zone_fields(ocr_text)
        fields = {
            "full_name": parsed.get("full_name") or visual.get("full_name"),
            "passport_number": parsed.get("passport_number") or visual.get("passport_number"),
            "date_of_birth": parsed.get("date_of_birth") or visual.get("date_of_birth"),
            "nationality": parsed.get("nationality") or visual.get("nationality"),
            "issuing_country": parsed.get("issuing_country") or visual.get("issuing_country") or parsed.get("nationality"),
            "expiry_date": parsed.get("expiry_date") or visual.get("expiry_date"),
            "mrz": parsed.get("mrz") or mrz or None,
        }
        filled = sum(1 for key, value in fields.items() if key != "mrz" and not _unknown(value))
        confidence = min(0.93, 0.35 + filled * 0.1)
        source = ExtractionSource.MRZ.value if parsed else ExtractionSource.LOCAL_PARSER.value
        return DocumentData(extraction_confidence=confidence, extraction_source=source, **fields)

    def merge_llm(self, local: DocumentData, llm_fields: dict[str, Any] | None) -> DocumentData:
        if not llm_fields:
            return local
        merged = local.model_dump()
        for key in ["full_name", "passport_number", "date_of_birth", "nationality", "issuing_country", "expiry_date", "mrz"]:
            value = llm_fields.get(key)
            if value and _unknown(merged.get(key)):
                merged[key] = value
        if llm_fields.get("confidence") is not None:
            merged["extraction_confidence"] = max(local.extraction_confidence, float(llm_fields["confidence"]))
        merged["extraction_source"] = ExtractionSource.GROQ.value
        return DocumentData.model_validate(merged)

    def extract(self, image_bytes: bytes | None, scenario: Scenario | None = None) -> tuple[DocumentData, CheckResult, bool]:
        groq_used = False
        ocr_text = ""
        tesseract_error = None
        if image_bytes:
            try:
                ocr_text = self.read_text(image_bytes)
            except Exception as exc:
                tesseract_error = str(exc)

        local = self.parse_local(ocr_text) if ocr_text else DocumentData()
        llm_fields = None
        if ocr_text:
            llm_fields = get_llm_provider().extract_passport_data(ocr_text)
            groq_used = llm_fields is not None
        document = self.merge_llm(local, llm_fields)

        filled = [
            document.full_name,
            document.passport_number,
            document.date_of_birth,
            document.nationality,
            document.expiry_date,
        ]
        known = sum(1 for value in filled if not _unknown(value))

        if known >= 4:
            status = CheckStatus.PASS
            reason = "Passport fields extracted successfully."
            confidence = max(document.extraction_confidence, 0.85)
        elif known >= 2:
            status = CheckStatus.WARNING
            reason = "OCR quality is partial; continuing with available fields."
            confidence = max(document.extraction_confidence, 0.55)
        else:
            status = CheckStatus.WARNING if scenario else CheckStatus.FAIL
            reason = tesseract_error or "OCR could not extract reliable passport fields."
            confidence = document.extraction_confidence
            if scenario:
                fallback = DEMO_DOCUMENTS[scenario]
                document = fallback
                reason = "OCR was incomplete; demo identity fields were used so the scenario could continue."
                status = CheckStatus.WARNING if scenario == Scenario.FAKE else CheckStatus.PASS
                confidence = fallback.extraction_confidence

        check = CheckResult(
            status=status,
            confidence=round(confidence, 2),
            reason=reason,
            simulated=document.extraction_source == ExtractionSource.DEMO_FALLBACK.value,
            details={
                "source": document.extraction_source,
                "raw_text_present": bool(ocr_text),
                "tesseract_error": tesseract_error,
            },
        )
        return document, check, groq_used


ocr_service = OcrService()
