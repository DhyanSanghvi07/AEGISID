import axios from 'axios'

const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
const normalizedBaseUrl = rawBaseUrl.replace(/\/+$/, '')
const API_BASE_URL = normalizedBaseUrl.endsWith('/api')
  ? normalizedBaseUrl
  : `${normalizedBaseUrl}/api`

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// JWT Token Interceptor
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor for unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('isAuthenticated')
        localStorage.removeItem('userRole')
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  }
)

export interface User {
  username: string
  role: string
  officer_id: string
}

export interface LoginRequest {
  username: string
  password: string
}

export interface TokenResponse {
  access_token: string
  user: User
}

export interface OCRResult {
  name: string
  passportNumber: string
  dateOfBirth: string
  nationality: string
  expiryDate: string
  mrz: string
  confidence: number
}

export interface MRZValidation {
  valid: boolean
  checksumValid: boolean
  errors: string[]
}

export interface NFCVerification {
  success: boolean
  chipData: any
  certificateValid: boolean
  dgData: any
}

export interface TamperAnalysis {
  score: number
  suspiciousRegions: any[]
  manipulationDetected: boolean
  elaScore: number
}

export interface FaceMatch {
  similarity: number
  match: boolean
  confidence: number
  threshold?: number
  status?: string
  details?: any
}

export interface FaceExtraction {
  success: boolean
  face_detected: boolean
  confidence: number
  face_image: string | null
  bounding_box: {
    x: number
    y: number
    width: number
    height: number
  } | null
  error: string | null
}

export interface LivenessResult {
  live: boolean
  confidence: number
  spoofType?: string
}

export interface RiskScore {
  score: number
  level: 'GREEN' | 'AMBER' | 'RED'
  decision: 'FAST_PASS' | 'HUMAN_REVIEW' | 'ALERT_LOCKOUT'
  reasons: Array<{
    check: string
    impact: number
    severity: string
    message: string
  }>
  passed_checks: string[]
  failed_checks: string[]
}

export interface CheckResult {
  status: 'PASS' | 'FAIL' | 'WARNING' | 'NOT_CHECKED'
  confidence: number | null
  reason: string
  simulated: boolean
  details?: Record<string, any>
}

export interface DocumentData {
  document_type: string
  passport_number: string | null
  full_name: string | null
  date_of_birth: string | null
  nationality: string | null
  issuing_country: string | null
  expiry_date: string | null
  mrz: string | null
  extraction_confidence: number
  extraction_source: string
}

export interface VerificationChecks {
  ocr: CheckResult
  mrz: CheckResult
  document_consistency: CheckResult
  face: CheckResult
  liveness: CheckResult
  nfc: CheckResult
  tamper: CheckResult
}

export interface VerificationMetadata {
  scenario: string | null
  prototype: boolean
  processing_time_ms: number
  groq_used: boolean
}

export interface VerificationResult {
  verification_id: string
  timestamp: string
  officer_id: string
  document: DocumentData
  checks: VerificationChecks
  risk: RiskScore
  metadata: VerificationMetadata
}

export interface HistoryRecord {
  verification_id: string
  timestamp: string
  officer_id: string
  scenario: string | null
  full_name: string | null
  passport_number_masked: string | null
  score: number
  level: 'GREEN' | 'AMBER' | 'RED'
  decision: 'FAST_PASS' | 'HUMAN_REVIEW' | 'ALERT_LOCKOUT'
}

export interface DashboardStats {
  total_verifications: number
  green_count: number
  amber_count: number
  red_count: number
  today_count: number
  recent: HistoryRecord[]
  high_risk_alerts: HistoryRecord[]
}

export interface RuntimeSettings {
  session_timeout_minutes: number
  groq_enabled: boolean
  groq_model: string
  demo_mode: boolean
  green_max: number
  amber_max: number
  max_upload_size_mb: number
  enable_nfc: boolean
  enable_liveness: boolean
  enable_tamper_detection: boolean
  enable_audit_logging: boolean
}

export interface AuditLog {
  audit_id: string
  timestamp: string
  actor: string
  action: string
  verification_id: string | null
  event_data: Record<string, any>
  previous_hash: string
  current_hash: string
}

export const apiService = {
  // Auth endpoints
  async login(username: string, password: string): Promise<TokenResponse> {
    const response = await api.post('/auth/login', { username, password })
    const { access_token, user } = response.data
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', access_token)
      localStorage.setItem('isAuthenticated', 'true')
      localStorage.setItem('userRole', user.role)
      localStorage.setItem('username', user.username)
    }
    return response.data
  },

  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout')
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('isAuthenticated')
        localStorage.removeItem('userRole')
        localStorage.removeItem('username')
      }
    }
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me')
    return response.data
  },

  // Main verification endpoint (complete flow)
  async verification(
    scenario: string | null,
    documentFile: File | null,
    faceImage: File | null
  ): Promise<VerificationResult> {
    const formData = new FormData()
    if (scenario) formData.append('scenario', scenario)
    if (documentFile) formData.append('document', documentFile)
    if (faceImage) formData.append('face_image', faceImage)

    const response = await api.post('/verification', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  // History endpoints
  async getHistory(): Promise<HistoryRecord[]> {
    const response = await api.get('/history')
    return response.data
  },

  async getHistoryItem(verificationId: string): Promise<VerificationResult> {
    const response = await api.get(`/history/${verificationId}`)
    return response.data
  },

  // Dashboard endpoint
  async getDashboard(): Promise<DashboardStats> {
    const response = await api.get('/dashboard')
    return response.data
  },

  // Settings endpoints
  async getSettings(): Promise<RuntimeSettings> {
    const response = await api.get('/settings')
    return response.data
  },

  async updateSettings(settings: Partial<RuntimeSettings>): Promise<RuntimeSettings> {
    const response = await api.post('/settings', settings)
    return response.data
  },

  // Audit endpoints
  async getAuditLogs(): Promise<AuditLog[]> {
    const response = await api.get('/audit-logs')
    return response.data
  },

  async getAuditLog(auditId: string): Promise<AuditLog> {
    const response = await api.get(`/audit-log/${auditId}`)
    return response.data
  },

  async createAuditLog(data: any): Promise<AuditLog> {
    const response = await api.post('/audit-log', data)
    return response.data
  },

  async verifyAuditIntegrity(): Promise<any> {
    const response = await api.get('/audit-integrity')
    return response.data
  },
}
