import asyncio
import unittest
from unittest.mock import patch

from fastapi import HTTPException

from app.api.verification import (
    extract_indian_document_fields,
    find_tesseract_executable,
    read_ocr_text,
    upload_document,
    verify_mrz,
)
from app.services.gemini import gemini_service


class VerificationTests(unittest.TestCase):
    def test_find_tesseract_executable_uses_common_windows_locations(self):
        with patch('app.api.verification.os.path.isfile', return_value=True):
            with patch('app.api.verification.shutil.which', return_value=None):
                result = find_tesseract_executable()
                self.assertIn('tesseract', result.lower())

    def test_indian_passport_style_text_extracts_identity_fields(self):
        sample = """Given Name(s)
SITA MAHA LAKSHMI
Nationality
INDIAN
Sex F
Date of Birth
23/09/1959
Place of Birth
GUNDUGOLANU
Date of Issue
11/10/2011
Date of Expiry
10/10/2021"""
        result = extract_indian_document_fields(sample)
        self.assertEqual(result['name'], 'SITA MAHA LAKSHMI')
        self.assertEqual(result['nationality'], 'INDIAN')
        self.assertEqual(result['dateOfBirth'], '1959-09-23')
        self.assertEqual(result['expiryDate'], '2021-10-10')

    def test_invalid_mrz_falls_back_to_indian_document_fields(self):
        class FakeFile:
            async def read(self):
                return b'fake-image-bytes'

        sample = """P<INDSITA<MAHA<LAKSHMI<<<<<<<<<<<<<<<<<<
Given Name(s)
SITA MAHA LAKSHMI
Nationality
INDIAN
Sex F
Date of Birth
23/09/1959
Place of Birth
GUNDUGOLANU
Date of Issue
11/10/2011
Date of Expiry
10/10/2021"""

        with patch('app.api.verification.read_ocr_text', return_value=sample), \
             patch.object(gemini_service, 'enabled', False):
            result = asyncio.run(upload_document(FakeFile()))
            self.assertEqual(result['name'], 'SITA MAHA LAKSHMI')
            self.assertEqual(result['nationality'], 'INDIAN')
            self.assertEqual(result['dateOfBirth'], '1959-09-23')

    def test_valid_mrz_passes(self):
        mrz = 'P<USAAB1234567<9001155M3001015<<<<<<<<<<<<<<5'
        result = asyncio.run(verify_mrz({"mrz": mrz}))
        self.assertTrue(result["valid"])
        self.assertTrue(result["checksumValid"])

    def test_invalid_mrz_fails(self):
        result = asyncio.run(verify_mrz({"mrz": 'bad-data'}))
        self.assertFalse(result["valid"])
        self.assertFalse(result["checksumValid"])

    def test_missing_tesseract_is_reported_clearly(self):
        class FakeFile:
            async def read(self):
                return b'fake-image-bytes'

        with patch('app.api.verification.find_tesseract_executable', return_value=None):
            with self.assertRaises(HTTPException) as ctx:
                asyncio.run(read_ocr_text(FakeFile()))
            self.assertIn('Tesseract is not installed or not in PATH', str(ctx.exception.detail))


if __name__ == '__main__':
    unittest.main()
