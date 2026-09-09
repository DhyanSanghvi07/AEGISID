'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Upload, Camera, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { apiService, VerificationResult } from '@/lib/api'

export default function DocumentPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated')
    if (!isAuthenticated) {
      router.push('/')
    }
  }, [router])

  useEffect(() => {
    if (!cameraOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      return
    }

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        })

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
      } catch (error) {
        setCameraError('Camera access was denied or unavailable. You can still upload an image manually.')
        setCameraOpen(false)
      }
    }

    startCamera()

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [cameraOpen])

  const setSelectedFile = (selectedFile: File) => {
    setFile(selectedFile)
    setError(null)
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(selectedFile)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setSelectedFile(selectedFile)
    }
  }

  const handleCapturePhoto = () => {
    if (!videoRef.current) return

    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (!blob) return
      const capturedFile = new File([blob], 'passport-scan.jpg', { type: 'image/jpeg' })
      setSelectedFile(capturedFile)
      setCameraOpen(false)
    }, 'image/jpeg', 0.92)
  }

  const handleProcess = async () => {
    if (!file) return

    setIsProcessing(true)
    setError(null)

    try {
      const scenario = localStorage.getItem('selectedScenario')
      const result: VerificationResult = await apiService.verification(scenario, file, null)
      
      // Store result in localStorage for results page
      localStorage.setItem('verificationResult', JSON.stringify(result))
      
      router.push('/verify/results')
    } catch (err: any) {
      const message = err?.response?.data?.detail || err?.message || 'Verification failed.'
      setError(message)
    } finally {
      setIsProcessing(false)
    }
  }

  const resetInput = () => {
    setFile(null)
    setPreview(null)
    setError(null)
    setCameraError(null)
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.push('/verify')}
              className="flex items-center text-slate-300 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-500 mr-3" />
              <span className="text-xl font-bold text-white">Document Verification</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Step 1: Document Scanning</h1>
          <p className="text-slate-400">Scan a passport with the camera or upload an image for OCR and MRZ extraction</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4">Passport Input</h2>

            {!preview ? (
              <>
                {cameraOpen ? (
                  <div className="space-y-4">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-64 object-cover rounded-lg bg-black"
                    />
                    <div className="flex gap-3">
                      <button
                        onClick={handleCapturePhoto}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
                      >
                        Capture Scan
                      </button>
                      <button
                        onClick={() => setCameraOpen(false)}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-400 mb-4">Use your camera or upload a passport image</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <button
                        onClick={() => setCameraOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer"
                      >
                        Open Camera
                      </button>
                      <label
                        htmlFor="file-upload"
                        className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg cursor-pointer inline-block"
                      >
                        Upload File
                      </label>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                  </div>
                )}

                {cameraError && (
                  <p className="mt-4 text-sm text-red-400">{cameraError}</p>
                )}
              </>
            ) : (
              <div className="relative">
                <div className="relative w-full min-h-80 max-h-[32rem] mb-4 overflow-auto rounded-lg bg-slate-900">
                  <Image
                    src={preview}
                    alt="Passport preview"
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <button
                  onClick={resetInput}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white p-2 rounded-full"
                >
                  <AlertCircle className="w-4 h-4" />
                </button>
              </div>
            )}

            {file && (
              <button
                onClick={handleProcess}
                disabled={isProcessing}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5 mr-2" />
                    Process Scanned Document
                  </>
                )}
              </button>
            )}

            {error && (
              <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            )}
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4">Verification Status</h2>

            {isProcessing ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 text-blue-500 mx-auto mb-4 animate-spin" />
                <p className="text-slate-400">Running verification...</p>
                <p className="text-slate-500 text-sm mt-2">This includes OCR, MRZ validation, biometric checks, and risk assessment.</p>
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-500">Upload a document to begin</p>
              </div>
            )}

            {error && (
              <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
