'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, AlertCircle, XCircle, Shield, Activity, FileText, User, Home } from 'lucide-react'
import { apiService } from '@/lib/api'

export default function ResultsPage() {
  const router = useRouter()
  const auditRecordedRef = useRef(false)
  const [results, setResults] = useState<any>(null)
  const [riskScore, setRiskScore] = useState<any>(null)
  const [riskError, setRiskError] = useState<string | null>(null)

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated')
    if (!isAuthenticated) {
      router.push('/')
      return
    }

    // Load all verification results from localStorage
    const ocrResult = JSON.parse(localStorage.getItem('ocrResult') || '{}')
    const mrzValid = JSON.parse(localStorage.getItem('mrzValid') || 'false')
    const faceMatch = JSON.parse(localStorage.getItem('faceMatch') || '{}')
    const liveness = JSON.parse(localStorage.getItem('liveness') || '{}')
    const nfcResult = JSON.parse(localStorage.getItem('nfcResult') || '{}')
    const tamperResult = JSON.parse(localStorage.getItem('tamperResult') || '{}')
    setResults({
      ocrResult,
      mrzValid,
      faceMatch,
      liveness,
      nfcResult,
      tamperResult
    })
    setRiskScore(null)

    if (auditRecordedRef.current) return
    auditRecordedRef.current = true

    const verificationId = `VER-${Date.now()}`
    const verificationData = {
      ocr: ocrResult,
      mrzValid,
      faceMatch,
      liveness,
      nfc: nfcResult,
      tamper: tamperResult,
    }

    const recordAudit = (finalRiskScore: any) => apiService.createAuditLog({
      verificationId,
      result: finalRiskScore.status,
      riskScore: finalRiskScore.score,
      checkResults: { ...verificationData, riskScore: finalRiskScore },
    }).catch((error) => {
      console.error('Failed to record verification audit log', error)
    })

    apiService.calculateRisk(verificationData)
      .then((geminiRiskScore) => {
        setRiskScore(geminiRiskScore)
        return recordAudit(geminiRiskScore)
      })
      .catch((error) => {
        setRiskError(error?.response?.data?.detail || 'Gemini scoring failed. Please try the verification again.')
      })
  }, [router])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'GREEN': return 'text-green-400 bg-green-400/10 border-green-400/30'
      case 'AMBER': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
      case 'RED': return 'text-red-400 bg-red-400/10 border-red-400/30'
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/30'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'GREEN': return <CheckCircle className="w-6 h-6" />
      case 'AMBER': return <AlertCircle className="w-6 h-6" />
      case 'RED': return <XCircle className="w-6 h-6" />
      default: return <Activity className="w-6 h-6" />
    }
  }

  const handleNewVerification = () => {
    localStorage.removeItem('ocrResult')
    localStorage.removeItem('mrzValid')
    localStorage.removeItem('faceMatch')
    localStorage.removeItem('liveness')
    localStorage.removeItem('nfcResult')
    localStorage.removeItem('tamperResult')
    localStorage.removeItem('faceExtraction')
    localStorage.removeItem('selectedScenario')
    router.push('/verify')
  }

  const handleBackToDashboard = () => {
    localStorage.removeItem('ocrResult')
    localStorage.removeItem('mrzValid')
    localStorage.removeItem('faceMatch')
    localStorage.removeItem('liveness')
    localStorage.removeItem('nfcResult')
    localStorage.removeItem('tamperResult')
    localStorage.removeItem('faceExtraction')
    localStorage.removeItem('selectedScenario')
    router.push('/dashboard')
  }

  if (riskError) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="max-w-lg rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center text-red-300">
          {riskError}
        </div>
      </div>
    )
  }

  if (!results || !riskScore) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading results...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.push('/verify/biometric')}
              className="flex items-center text-slate-300 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-blue-500 mr-3" />
              <span className="text-xl font-bold text-white">Verification Results</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Identity Verification Report</h1>
          <p className="text-slate-400">Passenger: {results.ocrResult.name} | Passport: {results.ocrResult.passportNumber}</p>
        </div>

        {/* Risk Score Banner */}
        <div className={`rounded-xl p-8 border-2 mb-8 ${getStatusColor(riskScore.status)}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Risk Score: {riskScore.score}/100</h2>
              <p className="text-lg">{riskScore.status === 'GREEN' ? 'FAST PASS' : riskScore.status === 'AMBER' ? 'HUMAN REVIEW' : 'ALERT & LOCKOUT'}</p>
            </div>
            <div className="text-6xl">
              {getStatusIcon(riskScore.status)}
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-semibold mb-2">Reasons:</h3>
            <ul className="space-y-1">
              {riskScore.reasons.map((reason: string, index: number) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Document Checks */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Document Checks
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <span className="text-slate-400">OCR</span>
                {results.ocrResult.confidence > 0.7 ? (
                  <span className="text-green-400 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    PASS
                  </span>
                ) : (
                  <span className="text-red-400 flex items-center">
                    <XCircle className="w-4 h-4 mr-2" />
                    FAIL
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <span className="text-slate-400">MRZ</span>
                {results.mrzValid ? (
                  <span className="text-green-400 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    PASS
                  </span>
                ) : (
                  <span className="text-red-400 flex items-center">
                    <XCircle className="w-4 h-4 mr-2" />
                    FAIL
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <span className="text-slate-400">NFC</span>
                {results.nfcResult.success ? (
                  <span className="text-green-400 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    PASS
                  </span>
                ) : (
                  <span className="text-red-400 flex items-center">
                    <XCircle className="w-4 h-4 mr-2" />
                    FAIL
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <span className="text-slate-400">Certificate</span>
                {results.nfcResult.certificateValid ? (
                  <span className="text-green-400 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    PASS
                  </span>
                ) : (
                  <span className="text-red-400 flex items-center">
                    <XCircle className="w-4 h-4 mr-2" />
                    FAIL
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <span className="text-slate-400">Tamper Detection</span>
                {!results.tamperResult.manipulationDetected ? (
                  <span className="text-green-400 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    PASS
                  </span>
                ) : (
                  <span className="text-red-400 flex items-center">
                    <XCircle className="w-4 h-4 mr-2" />
                    FAIL
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Biometric Checks */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Biometric Checks
            </h2>
            <div className="space-y-3">
              <div className="p-3 bg-slate-900/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400">Face Match</span>
                  {results.faceMatch.match ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                </div>
                <div className="text-white font-medium">
                  Similarity: {results.faceMatch.similarity_score || (results.faceMatch.similarity * 100).toFixed(1)}%
                </div>
                {results.faceMatch.status && (
                  <div className="text-slate-400 text-sm mt-1">
                    Status: {results.faceMatch.status}
                  </div>
                )}
              </div>
              <div className="p-3 bg-slate-900/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400">Liveness</span>
                  {results.liveness.live ? (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                </div>
                <div className="text-white font-medium">
                  {results.liveness.live ? 'Live Person Detected' : results.liveness.spoofType || 'Spoof Detected'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Breakdown */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Risk Score Breakdown
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">OCR Validity</span>
                <span className="text-white">{riskScore.breakdown.ocr}/20</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(riskScore.breakdown.ocr / 20) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">MRZ Validity</span>
                <span className="text-white">{riskScore.breakdown.mrz}/20</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(riskScore.breakdown.mrz / 20) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">NFC Validity</span>
                <span className="text-white">{riskScore.breakdown.nfc}/20</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(riskScore.breakdown.nfc / 20) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Certificate Validity</span>
                <span className="text-white">{riskScore.breakdown.certificate}/15</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(riskScore.breakdown.certificate / 15) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Face Match</span>
                <span className="text-white">{riskScore.breakdown.faceMatch}/15</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(riskScore.breakdown.faceMatch / 15) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Liveness</span>
                <span className="text-white">{riskScore.breakdown.liveness}/10</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: `${(riskScore.breakdown.liveness / 10) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-slate-400">Tamper Detection (Penalty)</span>
                <span className="text-white">-{riskScore.breakdown.tamper}</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-red-600 h-2 rounded-full"
                  style={{ width: `${Math.min((riskScore.breakdown.tamper / 30) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleNewVerification}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center"
          >
            <Shield className="w-5 h-5 mr-2" />
            New Verification
          </button>
          <button
            onClick={handleBackToDashboard}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  )
}
