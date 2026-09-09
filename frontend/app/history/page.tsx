'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle, AlertCircle, XCircle, Calendar, User, FileText } from 'lucide-react'

export default function HistoryPage() {
  const router = useRouter()
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated')
    if (!isAuthenticated) {
      router.push('/')
      return
    }

    // Mock history data
    const mockHistory = [
      {
        id: 'VER-001',
        timestamp: '2026-09-08 14:30:00',
        passengerName: 'John Doe',
        passportNumber: 'AB1234567',
        riskScore: 8,
        status: 'GREEN'
      },
      {
        id: 'VER-002',
        timestamp: '2026-09-08 13:45:00',
        passengerName: 'John Smith',
        passportNumber: 'XY9876543',
        riskScore: 62,
        status: 'AMBER'
      },
      {
        id: 'VER-003',
        timestamp: '2026-09-08 12:15:00',
        passengerName: 'Jane Johnson',
        passportNumber: 'ZZ5555555',
        riskScore: 85,
        status: 'RED'
      }
    ]
    setHistory(mockHistory)
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
      case 'GREEN': return <CheckCircle className="w-5 h-5" />
      case 'AMBER': return <AlertCircle className="w-5 h-5" />
      case 'RED': return <XCircle className="w-5 h-5" />
      default: return null
    }
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
              <FileText className="w-8 h-8 text-blue-500 mr-3" />
              <span className="text-xl font-bold text-white">Verification History</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Verification History</h1>
          <p className="text-slate-400">Previous passenger verification sessions</p>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">ID</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Passenger</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Passport</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Risk Score</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {history.map((record) => (
                <tr key={record.id} className="hover:bg-slate-700/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{record.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {record.timestamp}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white flex items-center">
                    <User className="w-4 h-4 mr-2 text-slate-400" />
                    {record.passengerName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{record.passportNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">{record.riskScore}/100</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(record.status)} flex items-center w-fit`}>
                      {getStatusIcon(record.status)}
                      <span className="ml-2">{record.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {history.length === 0 && (
          <div className="bg-slate-800 rounded-xl p-12 border border-slate-700 text-center">
            <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500">No verification history available</p>
          </div>
        )}
      </main>
    </div>
  )
}
