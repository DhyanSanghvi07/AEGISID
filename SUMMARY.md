# AEGISID - Project Summary

## Overview
AEGISID is an AI-based fake identity and document screening system designed for border security verification. It automates passport verification using multi-layer checks to determine document authenticity and verify the identity of the person presenting it.

## Purpose
Replace slow manual passport checking with an automated, multi-layer verification workflow that combines multiple security checks into a single system.

## Technology Stack

### Frontend
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with cybersecurity theme
- **Icons**: Lucide React
- **State Management**: React hooks + localStorage
- **HTTP Client**: Axios

### Backend
- **Framework**: FastAPI (Python)
- **Computer Vision**: OpenCV
- **OCR**: PyTesseract (with Gemini AI fallback)
- **Image Processing**: Pillow, NumPy
- **Authentication**: python-jose, passlib

## Core Features

### 1. Document Verification
- **OCR Extraction**: Extracts passport data (name, passport number, DOB, nationality, expiry)
- **MRZ Validation**: Validates Machine Readable Zone checksums
- **Gemini AI Integration**: Optional LLM-based document extraction (requires API key)

### 2. Biometric Verification
- **Face Matching**: Compares captured face with passport photo (simulated in prototype)
- **Liveness Detection**: Detects spoof attacks (simulated in prototype)
- **NFC Verification**: Validates e-passport chip data (simulated in prototype)
- **Tamper Detection**: Analyzes document for manipulation (simulated in prototype)

### 3. Risk Scoring Engine
- Calculates 0-100 risk score based on verification results
- **GREEN** (0-30): Fast Pass - Low risk
- **AMBER** (31-70): Human Review - Medium risk
- **RED** (71-100): Alert & Lockout - High risk
- Provides explainable breakdown of score components

### 4. Audit Logging
- Tamper-evident SHA-256 hash chaining
- Stores complete verification records
- Integrity verification capability

### 5. User Interface
- Role-based access control (Admin/Officer)
- Dashboard with verification statistics
- Verification history tracking
- System configuration settings
- Professional cybersecurity-themed design

## Demo Scenarios

### Scenario A - Genuine Passport
- All checks pass
- Risk Score: 8/100 (GREEN)
- Features: Valid OCR, MRZ, NFC, no tampering, high face match, live person

### Scenario B - Suspicious Passport
- Some checks fail
- Risk Score: 62/100 (AMBER)
- Features: MRZ inconsistency, tampered photograph, NFC failure

### Scenario C - Fake Identity
- Multiple failures
- Risk Score: 85/100 (RED)
- Features: Face mismatch, liveness failure, invalid chip, document tampering

## Project Structure

```
AEGISID/
├── frontend/
│   ├── app/
│   │   ├── page.tsx              # Login page
│   │   ├── dashboard/            # Main dashboard
│   │   ├── verify/               # Verification flow
│   │   ├── history/              # Verification history
│   │   ├── audit/                # Audit logs viewer
│   │   └── settings/             # System settings
│   ├── lib/                      # Utilities and API client
│   └── package.json
├── backend/
│   ├── app/
│   │   ├── api/                  # API endpoints
│   │   ├── models/               # Data models
│   │   ├── services/             # Business logic (OCR, Gemini, etc.)
│   │   └── utils/                # Utilities
│   ├── uploads/                  # File upload directory
│   ├── audit_logs/               # Tamper-evident audit storage
│   ├── main.py                   # FastAPI application entry
│   └── requirements.txt
└── README.md
```

## API Endpoints

### Verification APIs
- `POST /api/upload-document` - Upload and OCR passport
- `POST /api/mrz/verify` - Validate MRZ checksums
- `POST /api/nfc/verify` - Verify NFC chip
- `POST /api/tamper/analyze` - Analyze document for tampering
- `POST /api/face/match` - Compare faces
- `POST /api/liveness` - Check liveness
- `POST /api/risk-score` - Calculate risk score
- `POST /api/verification` - Complete verification
- `GET /api/history` - Get verification history

### Audit APIs
- `GET /api/audit-logs` - Get all audit logs
- `POST /api/audit-log` - Create audit log
- `GET /api/audit-log/{id}` - Get specific audit log
- `GET /api/audit-integrity` - Verify audit chain integrity

## Security Features
- Multi-layer verification (no single point of failure)
- Explainable AI with clear risk score reasons
- Tamper-evident audit logs with SHA-256 chaining
- Role-based access control
- Session management with configurable timeout
- Secure file handling with size limits
- No persistent biometric data (hashes only)

## Installation & Running

### Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- npm or yarn

### Setup
```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
pip install -r requirements.txt
python main.py
```

### Optional Gemini Configuration
Create `backend/.env` from `backend/.env.example`:
```
GEMINI_API_KEY=your-api-key
GEMINI_MODEL=gemini-1.5-flash
GEMINI_ENABLED=true
```

### Access
- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Demo credentials: admin/admin123 or officer/officer123

## Current Status
This is a **prototype** for demonstration purposes. The biometric verification (face matching, liveness, NFC, tamper detection) uses simulated data based on selected demo scenarios. Real AI/ML integrations are planned for Stage 2 production deployment.

## Planned Enhancements (Stage 2)
- Real NFC/e-Passport reading with PC/SC libraries
- BAC/PACE protocol for secure chip authentication
- Complete DG1-DG16 data group verification
- PKI certificate chain validation
- PaddleOCR integration for real OCR
- DeepFace integration for real face recognition
- Advanced liveness detection (active and passive)
- PostgreSQL database integration
- Docker containerization
- HTTPS/SSL deployment

## License
Prototype for educational and demonstration purposes.
