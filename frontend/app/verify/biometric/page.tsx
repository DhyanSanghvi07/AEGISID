'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle } from 'lucide-react'

export default function BiometricPage() {
  const router = useRouter()

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated')
    if (!isAuthenticated) {
      router.push('/')
      return
    }

    // Check if verification result exists
    const result = localStorage.getItem('verificationResult')
    if (!result) {
      // No result, go back to document page
      router.push('/verify/document')
      return
    }

    // Automatically go to results
    router.push('/verify/results')
  }, [router])

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center">
      <div className="text-center">
        <CheckCircle className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-pulse" />
        <p className="text-slate-300">Processing verification...</p>
      </div>
    </div>
  )
}

