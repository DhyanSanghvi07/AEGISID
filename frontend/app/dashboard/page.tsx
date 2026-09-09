'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, User, FileText, Activity, History, Settings, LogOut, Plus, CheckCircle, AlertTriangle, XCircle } from 'lucide-react'
import { apiService, DashboardStats } from '@/lib/api'

export default function DashboardPage() {
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated')
    if (!isAuthenticated) {
      router.push('/')
      return
    }

    const loadStats = async () => {
      try {
        const data = await apiService.getDashboard()
        setStats(data)
      } catch (error) {
        console.error('Failed to load dashboard stats', error)
        setStats({
          total_verifications: 0,
          green_count: 0,
          amber_count: 0,
          red_count: 0,
          today_count: 0,
          recent: [],
          high_risk_alerts: [],
        })
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [router])

  const handleLogout = async () => {
    try {
      await apiService.logout()
    } finally {
      router.push('/')
    }
  }

  const startVerification = () => {
    router.push('/verify')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Shield className="w-8 h-8 text-blue-500 mr-3" />
              <span className="text-xl font-bold text-white">AEGISID</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/history')}
                className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center"
              >
                <History className="w-4 h-4 mr-2" />
                History
              </button>
              <button
                onClick={() => router.push('/audit')}
                className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center"
              >
                <FileText className="w-4 h-4 mr-2" />
                Audit Logs
              </button>
              <button
                onClick={() => router.push('/settings')}
                className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </button>
              <button
                onClick={handleLogout}
                className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-slate-400">Border Security Verification System</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-8 h-8 text-blue-500" />
              <span className="text-2xl font-bold text-white">{stats?.total_verifications || 0}</span>
            </div>
            <p className="text-slate-400 text-sm">Total Verifications</p>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <span className="text-2xl font-bold text-white">{stats?.green_count || 0}</span>
            </div>
            <p className="text-slate-400 text-sm">Green Passes</p>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
              <span className="text-2xl font-bold text-white">{stats?.amber_count || 0}</span>
            </div>
            <p className="text-slate-400 text-sm">Amber Reviews</p>
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <XCircle className="w-8 h-8 text-red-500" />
              <span className="text-2xl font-bold text-white">{stats?.red_count || 0}</span>
            </div>
            <p className="text-slate-400 text-sm">Red Alerts</p>
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-8 border border-slate-700 mb-8">
          <h2 className="text-xl font-semibold text-white mb-6">Start New Verification</h2>
          <button
            onClick={startVerification}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Begin Passenger Verification
          </button>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
          <h2 className="text-xl font-semibold text-white mb-4">Verification Pipeline</h2>
          <div className="space-y-4">
            <div className="flex items-center text-slate-300">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold mr-4">1</div>
              <span>Document Scanning & OCR</span>
            </div>
            <div className="flex items-center text-slate-300">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold mr-4">2</div>
              <span>MRZ Validation</span>
            </div>
            <div className="flex items-center text-slate-300">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold mr-4">3</div>
              <span>NFC Chip Verification</span>
            </div>
            <div className="flex items-center text-slate-300">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold mr-4">4</div>
              <span>Document Forensics</span>
            </div>
            <div className="flex items-center text-slate-300">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold mr-4">5</div>
              <span>Face Verification</span>
            </div>
            <div className="flex items-center text-slate-300">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold mr-4">6</div>
              <span>Liveness Detection</span>
            </div>
            <div className="flex items-center text-slate-300">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold mr-4">7</div>
              <span>Cryptographic Verification</span>
            </div>
            <div className="flex items-center text-slate-300">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold mr-4">8</div>
              <span>Risk Scoring</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
