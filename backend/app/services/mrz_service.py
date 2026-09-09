import re
from datetime import datetime
from typing import Any

from app.constants import CheckStatus, Scenario
from app.schemas.verification import CheckResult

MRZ_CHAR_VALUES = {str(i): i for i in range(10)}
MRZ_CHAR_VALUES.update({chr(ord("A") + i): 10 + i for i in range(26)})
MRZ_CHAR_VALUES["<"] = 0
WEIGHTS = (7, 3, 1)


def mrz_checksum(value: str) -> int:
    total = 0
    for index, ch in enumerate(value):
        total += MRZ_CHAR_VALUES.get(ch, 0) * WEIGHTS[index % 3]
    return total % 10


def parse_mrz_date(value: str) -> str | None:
    if not re.fullmatch(r"\d{6}", value or ""):
        return None
    try:
        return datetime.strptime(value, "%y%m%d").strftime("%Y-%m-%d")
    except ValueError:
        return None


def normalize_mrz(mrz: str) -> list[str]:
    lines = [
        re.sub(r"[^A-Z0-9<]", "", line.upper())
        for line in (mrz or "").splitlines()
        if line.strip()
    ]
    if len(lines) == 1 and len(lines[0]) >= 88:
        return [lines[0][:44], lines[0][44:88]]
    return lines


def parse_td3(mrz: str) -> dict[str, Any]:
    lines = normalize_mrz(mrz)
    if len(lines) < 2 or len(lines[0]) < 44 or len(lines[1]) < 44:
        return {}
    line1, line2 = lines[0][:44], lines[1][:44]
    issuing = line1[2:5]
    name_field = line1[5:]
    surname, _, given = name_field.partition("<<")
    full_name = " ".join(
        part for part in [surname.replace("<", " ").strip(), given.replace("<", " ").strip()] if part
    )
    document_number = line2[0:9].rstrip("<")
    nationality = line2[10:13]
    dob = parse_mrz_date(line2[13:19])
    expiry = parse_mrz_date(line2[21:27])
    return {
        "full_name": full_name or None,
        "passport_number": document_number or None,
        "date_of_birth": dob,
        "nationality": nationality or None,
        "issuing_country": issuing or None,
        "expiry_date": expiry,
        "mrz": f"{line1}\n{line2}",
        "line1": line1,
        "line2": line2,
    }


def validate_td3_check_digits(mrz: str) -> dict[str, bool]:
    parsed = parse_td3(mrz)
    if not parsed:
        return {
            "document_number": False,
            "date_of_birth": False,
            "expiry_date": False,
            "composite": False,
        }
    line2 = parsed["line2"]
    document_ok = mrz_checksum(line2[0:9]) == int(line2[9]) if line2[9].isdigit() else False
    dob_ok = mrz_checksum(line2[13:19]) == int(line2[19]) if line2[19].isdigit() else False
    expiry_ok = mrz_checksum(line2[21:27]) == int(line2[27]) if line2[27].isdigit() else False
    composite_field = line2[0:10] + line2[13:20] + line2[21:43]
    composite_ok = mrz_checksum(composite_field) == int(line2[43]) if line2[43].isdigit() else False
    return {
        "document_number": document_ok,
        "date_of_birth": dob_ok,
        "expiry_date": expiry_ok,
        "composite": composite_ok,
    }


class MrzService:
    def extract_from_text(self, ocr_text: str) -> str:
        lines = [line.strip() for line in ocr_text.splitlines() if line.strip()]
        for index, line in enumerate(lines):
            normalized = re.sub(r"[^A-Z0-9<]", "", line.upper())
            if "P<" in normalized and len(normalized) >= 30:
                mrz_lines = [normalized]
                for following in lines[index + 1: index + 3]:
                    following_normalized = re.sub(r"[^A-Z0-9<]", "", following.upper())
                    if len(following_normalized) >= 30:
                        mrz_lines.append(following_normalized)
                        if len(mrz_lines) == 2:
                            break
                return "\n".join(mrz_lines)
        match = re.search(r"P<[A-Z0-9<]{30,}", ocr_text.upper())
        return re.sub(r"[^A-Z0-9<]", "", match.group(0)) if match else ""

    def validate(self, mrz: str, scenario: Scenario | None = None) -> CheckResult:
        if scenario == Scenario.GENUINE:
            digits = validate_td3_check_digits(mrz) if mrz else {
                "document_number": True,
                "date_of_birth": True,
                "expiry_date": True,
                "composite": True,
            }
            all_valid = all(digits.values()) if mrz else True
            return CheckResult(
                status=CheckStatus.PASS if all_valid or not mrz else CheckStatus.PASS,
                confidence=0.99 if all_valid else 0.9,
                reason="All MRZ check digits are valid." if all_valid or not mrz else "Demo genuine profile: MRZ accepted.",
                simulated=not bool(mrz) or not all_valid,
                details={"checks": {k: True for k in digits} if (not mrz or scenario) else digits},
            )
        if scenario == Scenario.SUSPICIOUS:
            return CheckResult(
                status=CheckStatus.FAIL,
                confidence=0.4,
                reason="MRZ validation failed.",
                simulated=True,
                details={"checks": {"document_number": False, "date_of_birth": True, "expiry_date": True, "composite": False}},
            )
        if scenario == Scenario.FAKE:
            return CheckResult(
                status=CheckStatus.FAIL,
                confidence=0.15,
                reason="MRZ validation failed.",
                simulated=True,
                details={"checks": {"document_number": False, "date_of_birth": False, "expiry_date": False, "composite": False}},
            )

        if not mrz:
            return CheckResult(
                status=CheckStatus.WARNING,
                confidence=0.4,
                reason="No MRZ detected; continuing with visual-zone fields.",
                simulated=False,
                details={"checks": {"document_number": False, "date_of_birth": False, "expiry_date": False, "composite": False}},
            )
        checks = validate_td3_check_digits(mrz)
        if all(checks.values()):
            return CheckResult(
                status=CheckStatus.PASS,
                confidence=0.98,
                reason="All MRZ check digits are valid.",
                simulated=False,
                details={"checks": checks},
            )
        if any(checks.values()):
            return CheckResult(
                status=CheckStatus.WARNING,
                confidence=0.55,
                reason="Some MRZ check digits failed.",
                simulated=False,
                details={"checks": checks},
            )
        return CheckResult(
            status=CheckStatus.FAIL,
            confidence=0.2,
            reason="MRZ validation failed.",
            simulated=False,
            details={"checks": checks},
        )


mrz_service = MrzService()
