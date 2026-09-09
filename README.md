# AEGISID — AI-Based Fake Identity & Document Screening System

A comprehensive border-security verification system that determines whether a passport is genuine and whether the person presenting it is the legitimate passport holder using multi-layer verification including OCR, MRZ validation, NFC chip verification, document forensics, face matching, liveness detection, and explainable risk scoring.

## 🎯 Project Overview

AEGISID replaces slow manual passport checking with an automated, multi-layer verification workflow that combines:

- **Passport Document Scanning** - OCR extraction of passport data
- **MRZ Validation** - Machine Readable Zone checksum verification
- **NFC/e-Passport Verification** - Chip reading and cryptographic validation
- **Document Forensics** - Image manipulation detection (ELA, splicing detection)
- **Face Verification** - Biometric face matching
- **Liveness Detection** - Passive spoof detection
- **Risk Scoring** - Explainable 0-100 risk score
- **Audit Logging** - Tamper-evident SHA-256 hash chaining

## 🏗️ Architecture

### Frontend (Next.js + Tailwind CSS)
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with custom cybersecurity theme
- **Icons**: Lucide React
- **State Management**: React hooks + localStorage (prototype)

### Backend (FastAPI + Python)
- **Framework**: FastAPI
- **Computer Vision**: OpenCV, PaddleOCR (planned)
- **Face Recognition**: DeepFace (planned)
- **NFC**: PC/SC libraries (planned for Stage 2)

## 📁 Project Structure

```
AEGISID/
├── frontend/                 # Next.js frontend application
│   ├── app/
│   │   ├── page.tsx        # Login page
│   │   ├── dashboard/     # Main dashboard
│   │   ├── verify/         # Verification flow
│   │   ├── history/        # Verification history
│   │   ├── audit/          # Audit logs viewer
│   │   └── settings/       # System settings
│   ├── lib/               # Utilities and API client
│   └── package.json
├── backend/                # FastAPI backend
│   ├── app/
│   │   ├── api/           # API endpoints
│   │   ├── models/        # Data models
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utilities
│   ├── uploads/           # File upload directory
│   ├── audit_logs/        # Tamper-evident audit storage
│   ├── main.py           # FastAPI application entry
│   └── requirements.txt
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v18 or higher)
- **Python** (v3.9 or higher)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
```bash
cd C:\Users\dhami\CascadeProjects\AEGISID
```

2. **Install Frontend Dependencies**
```bash
cd frontend
npm install
```

3. **Install Backend Dependencies**
```bash
cd ../backend
pip install -r requirements.txt
```

4. **Configure Gemini (optional fallback is automatic)**
Create `backend/.env` from `backend/.env.example` and set your Gemini API key:
```env
GEMINI_API_KEY=your-api-key
GEMINI_MODEL=gemini-2.5-flash
GEMINI_ENABLED=true
```

When configured, Gemini handles document field extraction and risk scoring. Without a key, the local OCR and scoring fallback remains active.

### Running the Application

1. **Start the Backend Server**
```bash
cd backend
python main.py
```
The backend will run on `http://localhost:8000`

2. **Start the Frontend Development Server**
```bash
cd frontend
npm run dev
```
The frontend will run on `http://localhost:3000`

### Demo Credentials

- **Admin**: username: `admin`, password: `admin123`
- **Officer**: username: `officer`, password: `officer123`

## 🎮 Demo Scenarios

The prototype includes three demo scenarios to demonstrate the verification pipeline:

### Scenario A — Genuine Passport
- **All checks pass**
- **Expected Result**: GREEN — FAST PASS (Risk Score: 8/100)
- **Features**: Valid OCR, valid MRZ, NFC success, no tampering, high face match, live person

### Scenario B — Suspicious Passport
- **Some checks fail**
- **Expected Result**: AMBER — HUMAN REVIEW (Risk Score: 62/100)
- **Features**: MRZ inconsistency, tampered photograph, NFC failure

### Scenario C — Fake Identity
- **Multiple failures**
- **Expected Result**: RED — ALERT & LOCKOUT (Risk Score: 85/100)
- **Features**: Face mismatch, liveness failure, invalid chip/certificate, document tampering

## 📊 Verification Pipeline

```
1. Document Scanning
   ↓
2. OCR + MRZ Extraction
   ↓
3. MRZ Checksum Validation
   ↓
4. NFC Chip Verification (Mock in Stage 1)
   ↓
5. Document Forensics (Mock in Stage 1)
   ↓
6. Face Verification
   ↓
7. Liveness Detection (Mock in Stage 1)
   ↓
8. Risk Scoring Engine
   ↓
9. GREEN / AMBER / RED Decision
   ↓
10. Audit Logging (SHA-256 Chain)
```

## 🔐 Security Features

- **Multi-layer verification** - No single point of failure
- **Explainable AI** - Clear reasons for risk scores
- **Tamper-evident audit logs** - SHA-256 hash chaining
- **Role-based access control** - Admin and Officer roles
- **Session management** - Configurable timeout
- **Secure file handling** - Size limits and validation
- **No persistent biometric data** - Hashes only stored

## 🎨 Pages Overview

### `/` - Login Page
Authentication with role-based access control

### `/dashboard` - Main Dashboard
- Verification statistics
- Quick access to verification flow
- Navigation to history, audit logs, and settings

### `/verify` - Scenario Selection
Choose between demo scenarios for testing

### `/verify/document` - Document Upload
- Passport image upload/capture
- OCR processing
- MRZ extraction and validation

### `/verify/biometric` - Biometric Verification
- Face capture
- Liveness detection
- NFC verification (mock)
- Tamper detection (mock)

### `/verify/results` - Verification Results
- Complete verification report
- Risk score with breakdown
- Individual check results
- Action recommendations

### `/history` - Verification History
- Previous verification sessions
- Search and filter capabilities

### `/audit` - Audit Logs
- Tamper-evident audit records
- SHA-256 hash chain visualization
- Integrity verification

### `/settings` - System Configuration
- Risk threshold configuration
- Feature toggles
- Security settings

## 🔧 Configuration

### Risk Score Thresholds

Configure in `/settings`:
- **GREEN**: 0-30 (Fast Pass)
- **AMBER**: 31-70 (Human Review)
- **RED**: 71-100 (Alert & Lockout)

### Feature Toggles

Enable/disable verification features:
- NFC Chip Verification
- Liveness Detection
- Tamper Detection
- Audit Logging

## 📈 Risk Score Calculation

The risk engine combines evidence from all verification modules:

```
Base Score: 100
- OCR Valid: -20
- MRZ Valid: -20
- NFC Valid: -20
- Certificate Valid: -15
- Face Match: -15
- Liveness: -10
+ Tamper Penalty: +0 to +30

Final Risk Score = 100 - (Sum of valid checks) + Tamper Penalty
```

Lower scores indicate lower risk (better).

## 🔮 Stage 2 - Advanced Integration

Planned enhancements for production deployment:

- **Real NFC/e-Passport Reading** - PC/SC library integration
- **BAC/PACE Protocol** - Secure chip authentication
- **DG1-DG16 Validation** - Complete data group verification
- **Certificate Chain Validation** - PKI validation
- **Real OCR** - PaddleOCR integration
- **Real Face Recognition** - DeepFace integration
- **Advanced Liveness** - Active and passive detection
- **Database Integration** - PostgreSQL for audit logs
- **Docker Deployment** - Containerized deployment
- **HTTPS/SSL** - Secure communication

## 🛠️ Technology Stack

### Frontend
- Next.js 14
- React 18
- Tailwind CSS
- Lucide Icons
- Axios

### Backend
- FastAPI
- Python 3.9+
- OpenCV
- NumPy
- Pillow
- PyTesseract (planned)

### AI/ML (Planned)
- PaddleOCR
- DeepFace
- PyTorch

## 📝 API Endpoints

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

## 🐛 Troubleshooting

### Frontend Issues
- **Module not found errors**: Run `npm install` in the frontend directory
- **Port already in use**: Change port in `next.config.js` or kill the process using port 3000

### Backend Issues
- **Module not found errors**: Run `pip install -r requirements.txt` in the backend directory
- **CORS errors**: Ensure backend is running and CORS is configured correctly in `main.py`

## 📄 License

This project is a prototype for educational and demonstration purposes.

## 👥 Contributing

This is a prototype project. For production deployment, implement real AI/ML integrations and security enhancements.

## 🎯 Key Features Implemented

✅ Complete verification workflow (Login → Dashboard → Verify → Results)
✅ Three demo scenarios (Genuine, Suspicious, Fake)
✅ Document upload and OCR simulation
✅ MRZ validation simulation
✅ Face capture and matching simulation
✅ Risk scoring engine with explainable breakdown
✅ Tamper-evident audit logging with SHA-256 chaining
✅ Verification history tracking
✅ System configuration settings
✅ Professional cybersecurity-themed UI
✅ Responsive design for border officer use

## 🔐 Security Notes

This is a **prototype** for demonstration purposes. For production:

1. Implement proper authentication (JWT, OAuth)
2. Add rate limiting and input validation
3. Use environment variables for sensitive data
4. Implement proper database integration
5. Add comprehensive logging and monitoring
6. Perform security audit and penetration testing
7. Use HTTPS in production
8. Implement proper session management
9. Add backup and recovery procedures
10. Comply with data protection regulations (GDPR, etc.)

---

**AEGISID** — Moving from manual checks to AI-powered multi-layer identity verification.
