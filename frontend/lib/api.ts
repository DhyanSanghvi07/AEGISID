import axios from 'axios'

const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8010/api'
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
  status: 'GREEN' | 'AMBER' | 'RED'
  reasons: string[]
  breakdown: {
    ocr: number
    mrz: number
    nfc: number
    certificate: number
    faceMatch: number
    liveness: number
    tamper: number
  }
}

export interface VerificationResult {
  id: string
  timestamp: string
  passengerName: string
  passportNumber: string
  ocr: OCRResult
  mrzValidation: MRZValidation
  nfc: NFCVerification
  tamper: TamperAnalysis
  faceMatch: FaceMatch
  liveness: LivenessResult
  riskScore: RiskScore
}

export const apiService = {
  async uploadDocument(file: File): Promise<OCRResult> {
    const formData = new FormData()
    formData.append('file', file)
    const response = await api.post('/upload-document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  async verifyMRZ(mrz: string): Promise<MRZValidation> {
    const response = await api.post('/mrz/verify', { mrz })
    return response.data
  },

  async verifyNFC(passportData: any): Promise<NFCVerification> {
    const response = await api.post('/nfc/verify', passportData)
    return response.data
  },

  async analyzeTamper(imageFile: File): Promise<TamperAnalysis> {
    const formData = new FormData()
    formData.append('file', imageFile)
    const response = await api.post('/tamper/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  async matchFace(passportImage: File, faceImage: File): Promise<FaceMatch> {
    const formData = new FormData()
    formData.append('passportImage', passportImage)
    formData.append('faceImage', faceImage)
    const response = await api.post('/face/match', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  async extractFace(imageFile: File): Promise<FaceExtraction> {
    const formData = new FormData()
    formData.append('file', imageFile)
    const response = await api.post('/face/extract', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  async checkLiveness(faceImage: File): Promise<LivenessResult> {
    const formData = new FormData()
    formData.append('file', faceImage)
    const response = await api.post('/liveness', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  async calculateRisk(verificationData: any): Promise<RiskScore> {
    const response = await api.post('/risk-score', verificationData)
    return response.data
  },

  async completeVerification(data: any): Promise<VerificationResult> {
    const response = await api.post('/verification', data)
    return response.data
  },

  async getHistory() {
    const response = await api.get('/history')
    return response.data
  },

  async getAuditLogs() {
    const response = await api.get('/audit-logs')
    return response.data
  },

  async createAuditLog(data: any) {
    const response = await api.post('/audit-log', data)
    return response.data
  },
}
