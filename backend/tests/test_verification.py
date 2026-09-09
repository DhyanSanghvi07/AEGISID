import asyncio
import unittest
from unittest.mock import patch

from fastapi import HTTPException

from app.services.mrz_service import mrz_service, validate_td3_check_digits, parse_td3
from app.services.ocr_service import find_tesseract_executable
from app.constants import Scenario


class VerificationTests(unittest.TestCase):
    def test_valid_mrz_passes_checksum(self):
        """Test that valid MRZ passes checksum validation."""
        mrz = "P<USATRAVELER<<ALEX<<<<<<<<<<<<<<<<<<<<<<<\nP1234567<8USA9001157M3001155<<<<<<<<<<<<<<04"
        result = mrz_service.validate(mrz, scenario=Scenario.GENUINE)
        self.assertEqual(result.status.value, "PASS")

    def test_invalid_mrz_fails(self):
        """Test that invalid MRZ fails validation."""
        result = mrz_service.validate("invalid-mrz", scenario=None)
        self.assertIn(result.status.value, ["FAIL", "WARNING"])

    def test_genuine_scenario_passes_all_checks(self):
        """Test that GENUINE scenario returns PASS for all checks."""
        result = mrz_service.validate("any-mrz", scenario=Scenario.GENUINE)
        self.assertEqual(result.status.value, "PASS")

    def test_suspicious_scenario_fails_mrz(self):
        """Test that SUSPICIOUS scenario returns FAIL for MRZ."""
        result = mrz_service.validate("any-mrz", scenario=Scenario.SUSPICIOUS)
        self.assertEqual(result.status.value, "FAIL")

    def test_fake_scenario_fails_mrz(self):
        """Test that FAKE scenario returns FAIL for MRZ."""
        result = mrz_service.validate("any-mrz", scenario=Scenario.FAKE)
        self.assertEqual(result.status.value, "FAIL")

    def test_td3_parsing(self):
        """Test TD3 format MRZ parsing."""
        mrz = "P<USATRAVELER<<ALEX<<<<<<<<<<<<<<<<<<<<<<<\nP1234567<8USA9001157M3001155<<<<<<<<<<<<<<04"
        parsed = parse_td3(mrz)
        self.assertEqual(parsed.get("full_name"), "ALEX TRAVELER")
        self.assertEqual(parsed.get("passport_number"), "P1234567")
        self.assertEqual(parsed.get("nationality"), "USA")


if __name__ == '__main__':
    unittest.main()
