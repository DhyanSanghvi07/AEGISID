'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, AlertCircle, XCircle, Shield, Activity, FileText, User, Home } from 'lucide-react'
import { VerificationResult } from '@/lib/api'

export default function ResultsPage() {
  const router = useRouter()
  const [result, setResult] = useState<VerificationResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated')
    if (!isAuthenticated) {
      router.push('/')
      return
    }

    // Load verification result from localStorage
    const storedResult = localStorage.getItem('verificationResult')
    if (storedResult) {
      try {
        setResult(JSON.parse(storedResult))
      } catch (error) {
        console.error('Failed to parse verification result', error)
        router.push('/verify')
      }
    } else {
      router.push('/verify')
    }
    setLoading(false)
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
    localStorage.removeItem('verificationResult')
    localStorage.removeItem('selectedScenario')
    router.push('/verify')
  }

  const handleBackToDashboard = () => {
    localStorage.removeItem('verificationResult')
    localStorage.removeItem('selectedScenario')
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading results...</div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="max-w-lg rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-center text-red-300">
          No verification result found. Please start a new verification.
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={handleNewVerification}
              className="flex items-center text-slate-300 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Verification
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
          <p className="text-slate-400">
            ID: {result.verification_id} | Timestamp: {new Date(result.timestamp).toLocaleString()}
          </p>
        </div>

        {/* Risk Score Banner */}
        <div className={`rounded-xl p-8 border-2 mb-8 ${getStatusColor(result.risk.level)}`}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Risk Score: {result.risk.score}/100</h2>
              <p className="text-lg font-semibold">Decision: {result.risk.decision.replace(/_/g, ' ')}</p>
            </div>
            <div className="text-6xl">
              {getStatusIcon(result.risk.level)}
            </div>
          </div>
          <div className="mt-6">
            <h3 className="font-semibold mb-3">Risk Factors:</h3>
            <div className="space-y-2">
              {result.risk.reasons.map((reason, index) => (
                <div key={index} className="flex items-start">
                  <span className={`px-2 py-1 rounded text-xs font-semibold mr-3 ${
                    reason.severity === 'HIGH' ? 'bg-red-500/20 text-red-300' :
                    reason.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-green-500/20 text-green-300'
                  }`}>
                    {reason.severity}
                  </span>
                  <div>
                    <div className="font-medium">{reason.check.replace(/_/g, ' ').toUpperCase()}</div>
                    <div className="text-sm opacity-90">{reason.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Verification Checks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* OCR Check */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">OCR Extraction</h3>
              {result.checks.ocr.status === 'PASS' && <CheckCircle className="w-6 h-6 text-green-400" />}
              {result.checks.ocr.status === 'FAIL' && <XCircle className="w-6 h-6 text-red-400" />}
              {result.checks.ocr.status === 'WARNING' && <AlertCircle className="w-6 h-6 text-yellow-400" />}
            </div>
            <p className="text-slate-300 text-sm mb-3">{result.checks.ocr.reason}</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Name:</span> <span className="text-white">{result.document.full_name}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Passport:</span> <span className="text-white">{result.document.passport_number}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">DOB:</span> <span className="text-white">{result.document.date_of_birth}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Expiry:</span> <span className="text-white">{result.document.expiry_date}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Source:</span> <span className="text-white">{result.document.extraction_source}</span></div>
            </div>
          </div>

          {/* MRZ Check */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">MRZ Validation</h3>
              {result.checks.mrz.status === 'PASS' && <CheckCircle className="w-6 h-6 text-green-400" />}
              {result.checks.mrz.status === 'FAIL' && <XCircle className="w-6 h-6 text-red-400" />}
              {result.checks.mrz.status === 'WARNING' && <AlertCircle className="w-6 h-6 text-yellow-400" />}
            </div>
            <p className="text-slate-300 text-sm mb-3">{result.checks.mrz.reason}</p>
            <div className="text-xs text-slate-400 bg-slate-900/50 p-3 rounded font-mono break-all">{result.document.mrz}</div>
          </div>

          {/* Face Check */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Face Verification</h3>
              {result.checks.face.status === 'PASS' && <CheckCircle className="w-6 h-6 text-green-400" />}
              {result.checks.face.status === 'FAIL' && <XCircle className="w-6 h-6 text-red-400" />}
              {result.checks.face.status === 'WARNING' && <AlertCircle className="w-6 h-6 text-yellow-400" />}
            </div>
            <p className="text-slate-300 text-sm mb-3">{result.checks.face.reason}</p>
            {result.checks.face.simulated && <p className="text-xs text-slate-500">[Simulated Check]</p>}
          </div>

          {/* Liveness Check */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Liveness Detection</h3>
              {result.checks.liveness.status === 'PASS' && <CheckCircle className="w-6 h-6 text-green-400" />}
              {result.checks.liveness.status === 'FAIL' && <XCircle className="w-6 h-6 text-red-400" />}
              {result.checks.liveness.status === 'WARNING' && <AlertCircle className="w-6 h-6 text-yellow-400" />}
            </div>
            <p className="text-slate-300 text-sm mb-3">{result.checks.liveness.reason}</p>
            {result.checks.liveness.simulated && <p className="text-xs text-slate-500">[Simulated Check]</p>}
          </div>

          {/* NFC Check */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">NFC Chip Verification</h3>
              {result.checks.nfc.status === 'PASS' && <CheckCircle className="w-6 h-6 text-green-400" />}
              {result.checks.nfc.status === 'FAIL' && <XCircle className="w-6 h-6 text-red-400" />}
              {result.checks.nfc.status === 'WARNING' && <AlertCircle className="w-6 h-6 text-yellow-400" />}
            </div>
            <p className="text-slate-300 text-sm mb-3">{result.checks.nfc.reason}</p>
            {result.checks.nfc.simulated && <p className="text-xs text-slate-500">[Simulated Check]</p>}
          </div>

          {/* Tamper Check */}
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Tamper Analysis</h3>
              {result.checks.tamper.status === 'PASS' && <CheckCircle className="w-6 h-6 text-green-400" />}
              {result.checks.tamper.status === 'FAIL' && <XCircle className="w-6 h-6 text-red-400" />}
              {result.checks.tamper.status === 'WARNING' && <AlertCircle className="w-6 h-6 text-yellow-400" />}
            </div>
            <p className="text-slate-300 text-sm mb-3">{result.checks.tamper.reason}</p>
            {result.checks.tamper.simulated && <p className="text-xs text-slate-500">[Simulated Check]</p>}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Verification Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{result.risk.passed_checks.length}</div>
              <div className="text-xs text-slate-400 mt-2">Checks Passed</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{result.risk.failed_checks.length}</div>
              <div className="text-xs text-slate-400 mt-2">Checks Failed</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{result.metadata.processing_time_ms}ms</div>
              <div className="text-xs text-slate-400 mt-2">Processing Time</div>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-4 text-center">
              <div className="text-sm font-semibold text-slate-300">{result.metadata.groq_used ? 'Groq' : 'Local'}</div>
              <div className="text-xs text-slate-400 mt-2">OCR Method</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={handleNewVerification}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            New Verification
          </button>
          <button
            onClick={handleBackToDashboard}
            className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors flex items-center"
          >
            <Home className="w-5 h-5 mr-2" />
            Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  )
}
