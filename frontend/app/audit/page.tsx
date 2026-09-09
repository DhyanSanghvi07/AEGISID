'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Shield, FileText, Hash, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import { apiService } from '@/lib/api'

export default function AuditPage() {
  const router = useRouter()
  const [auditLogs, setAuditLogs] = useState<any[]>([])

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated')
    if (!isAuthenticated) {
      router.push('/')
      return
    }

    apiService.getAuditLogs().then(setAuditLogs).catch(() => setAuditLogs([]))
  }, [router])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'GREEN': return 'text-green-400 bg-green-400/10 border-green-400/30'
      case 'AMBER': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
      case 'RED': return 'text-red-400 bg-red-400/10 border-red-400/30'
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/30'
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
              <Shield className="w-8 h-8 text-blue-500 mr-3" />
              <span className="text-xl font-bold text-white">Audit Logs</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Tamper-Evident Audit Logs</h1>
          <p className="text-slate-400">Immutable verification records with SHA-256 hash chaining</p>
        </div>

        <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 mb-8">
          <div className="flex items-start">
            <Shield className="w-6 h-6 text-blue-400 mr-3 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Hash Chain Integrity</h3>
              <p className="text-slate-400 text-sm">
                Each audit record contains a SHA-256 hash of the verification data and the previous log&apos;s hash.
                This creates an immutable chain where any modification to historical records can be detected.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {auditLogs.map((log, index) => (
            <div key={log.id} className="bg-slate-800 rounded-xl p-6 border border-slate-700">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-blue-400 mr-2" />
                  <span className="text-white font-medium">{log.id}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(log.result)}`}>
                  {log.result}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center text-slate-400">
                  <Clock className="w-4 h-4 mr-2" />
                  <span className="text-sm">{log.timestamp}</span>
                </div>
                <div className="flex items-center text-slate-400">
                  <FileText className="w-4 h-4 mr-2" />
                  <span className="text-sm">Verification: {log.verificationId}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center text-slate-400 text-sm mb-1">
                    <Hash className="w-4 h-4 mr-2" />
                    Data Hash (SHA-256)
                  </div>
                  <div className="bg-slate-900/50 rounded p-2 font-mono text-xs text-slate-300 break-all">
                    {log.dataHash}
                  </div>
                </div>

                <div>
                  <div className="flex items-center text-slate-400 text-sm mb-1">
                    <Hash className="w-4 h-4 mr-2" />
                    Previous Hash
                  </div>
                  <div className="bg-slate-900/50 rounded p-2 font-mono text-xs text-slate-300 break-all">
                    {log.previousHash}
                  </div>
                </div>

                <div>
                  <div className="flex items-center text-slate-400 text-sm mb-1">
                    <Shield className="w-4 h-4 mr-2" />
                    Chain Hash (Current)
                  </div>
                  <div className="bg-slate-900/50 rounded p-2 font-mono text-xs text-blue-300 break-all">
                    {log.chainHash}
                  </div>
                </div>
              </div>

              {index < auditLogs.length - 1 && (
                <div className="mt-4 pt-4 border-t border-slate-700 flex items-center text-slate-500 text-sm">
                  <div className="w-0.5 h-8 bg-slate-600 mr-3"></div>
                  <span>Chained to next record</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {auditLogs.length === 0 && (
          <div className="bg-slate-800 rounded-xl p-12 border border-slate-700 text-center">
            <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-500">No audit logs available</p>
          </div>
        )}
      </main>
    </div>
  )
}
