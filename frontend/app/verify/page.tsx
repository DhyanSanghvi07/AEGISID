'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, ArrowLeft, ArrowRight } from 'lucide-react'

export default function VerifyPage() {
  const router = useRouter()
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated')
    if (!isAuthenticated) {
      router.push('/')
    }
  }, [router])

  const scenarios = [
    {
      id: 'genuine',
      title: 'Scenario A: Genuine Passport',
      description: 'All checks pass. Expected result: GREEN — FAST PASS',
      color: 'green'
    },
    {
      id: 'suspicious',
      title: 'Scenario B: Suspicious Passport',
      description: 'MRZ mismatch, tampered photograph, NFC failure. Expected result: AMBER — HUMAN REVIEW',
      color: 'yellow'
    },
    {
      id: 'fake',
      title: 'Scenario C: Fake Identity',
      description: 'Face mismatch, liveness failure, invalid chip. Expected result: RED — ALERT & LOCKOUT',
      color: 'red'
    }
  ]

  const handleScenarioSelect = (scenarioId: string) => {
    setSelectedScenario(scenarioId)
    localStorage.setItem('selectedScenario', scenarioId)
    router.push('/verify/document')
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center text-slate-300 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </button>
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-blue-500 mr-3" />
              <span className="text-xl font-bold text-white">AEGISID</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Start Verification</h1>
          <p className="text-slate-400">Select a demo scenario to begin the verification process</p>
        </div>

        <div className="grid gap-6">
          {scenarios.map((scenario) => (
            <button
              key={scenario.id}
              onClick={() => handleScenarioSelect(scenario.id)}
              className={`bg-slate-800 border-2 rounded-xl p-6 text-left transition-all duration-200 hover:border-blue-500 ${
                selectedScenario === scenario.id ? 'border-blue-500' : 'border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">{scenario.title}</h3>
                  <p className="text-slate-400">{scenario.description}</p>
                </div>
                <ArrowRight className="w-6 h-6 text-slate-400 mt-1" />
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h3 className="text-lg font-semibold text-white mb-4">Verification Steps</h3>
          <ol className="space-y-2 text-slate-300">
            <li className="flex items-center">
              <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold mr-3">1</span>
              Document Scanning & OCR
            </li>
            <li className="flex items-center">
              <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold mr-3">2</span>
              MRZ Validation
            </li>
            <li className="flex items-center">
              <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold mr-3">3</span>
              NFC Chip Verification
            </li>
            <li className="flex items-center">
              <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold mr-3">4</span>
              Document Forensics
            </li>
            <li className="flex items-center">
              <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold mr-3">5</span>
              Face Verification
            </li>
            <li className="flex items-center">
              <span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold mr-3">6</span>
              Risk Scoring & Results
            </li>
          </ol>
        </div>
      </main>
    </div>
  )
}
