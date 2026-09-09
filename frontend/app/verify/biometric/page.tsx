'use client'

import Image from 'next/image'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Camera, User, CheckCircle, AlertCircle, Loader2, Shield, RefreshCw } from 'lucide-react'
import { apiService } from '@/lib/api'

type CameraState = 'INITIALIZING' | 'READY' | 'FACE_NOT_DETECTED' | 'FACE_DETECTED' | 'CAPTURING' | 'VERIFYING' | 'MATCH' | 'MISMATCH' | 'ERROR'

export default function BiometricPage() {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  
  const [faceImage, setFaceImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [faceMatch, setFaceMatch] = useState<any>(null)
  const [liveness, setLiveness] = useState<any>(null)
  const [nfcResult, setNfcResult] = useState<any>(null)
  const [tamperResult, setTamperResult] = useState<any>(null)
  
  // Camera states
  const [cameraOpen, setCameraOpen] = useState(false)
  const [cameraState, setCameraState] = useState<CameraState>('INITIALIZING')
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  
  // Load extracted passport face from localStorage
  const [passportFace, setPassportFace] = useState<string | null>(null)

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated')
    if (!isAuthenticated) {
      router.push('/')
      return
    }
    
    // Load extracted passport face
    const faceExtraction = localStorage.getItem('faceExtraction')
    if (faceExtraction) {
      const parsed = JSON.parse(faceExtraction)
      if (parsed.face_detected && parsed.face_image) {
        setPassportFace(parsed.face_image)
      }
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
      setCameraState('INITIALIZING')
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        })

        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setCameraState('READY')
        }
      } catch (error) {
        setCameraError('Camera access was denied or unavailable.')
        setCameraState('ERROR')
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFaceImage(selectedFile)
      setCameraOpen(false)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
        setCapturedImage(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    }
  }
  
  const captureFromCamera = () => {
    if (!videoRef.current || !canvasRef.current) return
    
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    ctx.drawImage(video, 0, 0)
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.92)
    setCapturedImage(imageDataUrl)
    setPreview(imageDataUrl)
    
    // Convert to File for API
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'live-face.jpg', { type: 'image/jpeg' })
        setFaceImage(file)
      }
    }, 'image/jpeg', 0.92)
    
    setCameraOpen(false)
  }
  
  const retakePhoto = () => {
    setCapturedImage(null)
    setPreview(null)
    setFaceImage(null)
    setFaceMatch(null)
    setCameraOpen(true)
  }

  const handleProcess = async () => {
    if (!faceImage) return

    setIsProcessing(true)
    setCameraState('VERIFYING')

    try {
      // Get passport face from localStorage and convert to File
      if (!passportFace) {
        throw new Error('No passport face extracted. Please go back and extract the passport face first.')
      }
      
      // Convert base64 to blob
      const base64Response = await fetch(`data:image/jpeg;base64,${passportFace}`)
      const blob = await base64Response.blob()
      const passportFile = new File([blob], 'passport-face.jpg', { type: 'image/jpeg' })
      
      // Real face matching
      const matchResult = await apiService.matchFace(passportFile, faceImage)
      setFaceMatch(matchResult)
      
      // Set camera state based on match result
      if (matchResult.match) {
        setCameraState('MATCH')
      } else {
        setCameraState('MISMATCH')
      }
      
      // Simulate other checks (NFC, liveness, tamper) for demo
      const scenario = localStorage.getItem('selectedScenario') || 'genuine'
      let mockLiveness, mockNfcResult, mockTamperResult
      
      if (scenario === 'genuine') {
        mockLiveness = { live: true, confidence: 0.92 }
        mockNfcResult = { success: true, chipData: { valid: true }, certificateValid: true }
        mockTamperResult = { score: 0.05, manipulationDetected: false, elaScore: 0.03 }
      } else if (scenario === 'suspicious') {
        mockLiveness = { live: true, confidence: 0.85 }
        mockNfcResult = { success: false, chipData: { valid: false }, certificateValid: false }
        mockTamperResult = { score: 0.45, manipulationDetected: true, elaScore: 0.52 }
      } else {
        mockLiveness = { live: false, confidence: 0.65, spoofType: 'photo' }
        mockNfcResult = { success: false, chipData: { valid: false }, certificateValid: false }
        mockTamperResult = { score: 0.72, manipulationDetected: true, elaScore: 0.78 }
      }
      
      setLiveness(mockLiveness)
      setNfcResult(mockNfcResult)
      setTamperResult(mockTamperResult)
      
      // Store results for next step
      localStorage.setItem('faceMatch', JSON.stringify(matchResult))
      localStorage.setItem('liveness', JSON.stringify(mockLiveness))
      localStorage.setItem('nfcResult', JSON.stringify(mockNfcResult))
      localStorage.setItem('tamperResult', JSON.stringify(mockTamperResult))
    } catch (err: any) {
      const message = err?.response?.data?.detail || err?.message || 'Face matching failed.'
      setCameraError(message)
      setCameraState('ERROR')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleNext = () => {
    router.push('/verify/results')
  }
  
  const getCameraStateMessage = () => {
    switch (cameraState) {
      case 'INITIALIZING': return 'Initializing camera...'
      case 'READY': return 'Position your face inside the frame'
      case 'FACE_NOT_DETECTED': return 'No face detected - adjust position'
      case 'FACE_DETECTED': return 'Face detected - hold still'
      case 'CAPTURING': return 'Capturing...'
      case 'VERIFYING': return 'Analyzing biometric match...'
      case 'MATCH': return 'Identity match confirmed'
      case 'MISMATCH': return 'Identity mismatch detected'
      case 'ERROR': return cameraError || 'Camera error'
      default: return ''
    }
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button
              onClick={() => router.push('/verify/document')}
              className="flex items-center text-slate-300 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <div className="flex items-center">
              <User className="w-8 h-8 text-blue-500 mr-3" />
              <span className="text-xl font-bold text-white">Biometric Verification</span>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Step 2: Biometric & Security Verification</h1>
          <p className="text-slate-400">Face capture, liveness detection, NFC verification, and document forensics</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4">Face Capture</h2>
            
            {/* Camera Feed */}
            {cameraOpen && (
              <div className="space-y-4">
                <div className="relative w-full h-64 bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  <div className="absolute bottom-4 left-4 right-4 bg-black/70 rounded-lg p-3">
                    <p className="text-white text-sm text-center">{getCameraStateMessage()}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={captureFromCamera}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
                  >
                    Capture Photo
                  </button>
                  <button
                    onClick={() => setCameraOpen(false)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            {/* Captured Image or Upload */}
            {!cameraOpen && !preview ? (
              <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
                <Camera className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400 mb-4">Capture or upload face image</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => setCameraOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg cursor-pointer"
                  >
                    Open Camera
                  </button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="face-upload"
                  />
                  <label
                    htmlFor="face-upload"
                    className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg cursor-pointer inline-block"
                  >
                    Upload File
                  </label>
                </div>
              </div>
            ) : !cameraOpen && preview ? (
              <div className="space-y-4">
                <div className="relative w-full h-64 rounded-lg overflow-hidden bg-slate-900">
                  <Image
                    src={preview}
                    alt="Captured face"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <button
                  onClick={retakePhoto}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Retake Photo
                </button>
              </div>
            ) : null}

            {cameraError && (
              <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
                {cameraError}
              </div>
            )}

            {faceImage && !faceMatch && (
              <button
                onClick={handleProcess}
                disabled={isProcessing}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5 mr-2" />
                    Run Verification
                  </>
                )}
              </button>
            )}
          </div>

          <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
            <h2 className="text-xl font-semibold text-white mb-4">Verification Results</h2>
            
            {!faceMatch ? (
              <div className="text-center py-12">
                <Shield className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-500">Capture face to run verification</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Face Comparison Display */}
                <div className="bg-slate-900/50 rounded-lg p-4">
                  <h3 className="text-slate-400 font-medium mb-3 text-center">BIOMETRIC VERIFICATION</h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="relative w-full h-32 rounded-lg overflow-hidden bg-slate-900 mb-2">
                        {passportFace ? (
                          <Image
                            src={`data:image/jpeg;base64,${passportFace}`}
                            alt="Passport face"
                            fill
                            className="object-contain"
                            unoptimized
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-600">No passport face</div>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm">Passport Face</p>
                    </div>
                    <div className="text-center">
                      <div className="relative w-full h-32 rounded-lg overflow-hidden bg-slate-900 mb-2">
                        {capturedImage ? (
                          <Image
                            src={capturedImage}
                            alt="Live face"
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-slate-600">No live face</div>
                        )}
                      </div>
                      <p className="text-slate-400 text-sm">Live Face</p>
                    </div>
 </div>
                  
                  {/* Match Score Display */}
                  <div className="text-center py-4 border-t border-slate-700">
                    <p className="text-slate-400 text-sm mb-2">MATCH SCORE</p>
                    <div className={`text-4xl font-bold ${faceMatch.match ? 'text-green-400' : 'text-red-400'} mb-2`}>
                      {faceMatch.similarity_score || (faceMatch.similarity * 100).toFixed(1)}%
                    </div>
                    <div className={`flex items-center justify-center ${faceMatch.match ? 'text-green-400' : 'text-red-400'}`}>
                      {faceMatch.match ? (
                        <>
                          <CheckCircle className="w-6 h-6 mr-2" />
                          <span className="font-semibold">MATCHED</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-6 h-6 mr-2" />
                          <span className="font-semibold">MISMATCH</span>
                        </>
                      )}
                    </div>
                    {faceMatch.threshold && (
                      <p className="text-slate-500 text-xs mt-2">Threshold: {faceMatch.threshold}%</p>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-slate-900/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400">Liveness Detection</span>
                    {liveness.live ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div className="text-white font-medium">
                    {liveness.live ? 'Live' : liveness.spoofType || 'Spoof Detected'}
                  </div>
                </div>

                <div className="p-3 bg-slate-900/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400">NFC Verification</span>
                    {nfcResult.success ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div className="text-white font-medium">
                    {nfcResult.success ? 'Chip Valid' : 'Chip Invalid'}
                  </div>
                </div>

                <div className="p-3 bg-slate-900/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400">Tamper Detection</span>
                    {tamperResult.manipulationDetected ? (
                      <AlertCircle className="w-5 h-5 text-red-400" />
                    ) : (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    )}
                  </div>
                  <div className="text-white font-medium">
                    {tamperResult.manipulationDetected ? 'Manipulation Detected' : 'No Manipulation'}
                  </div>
                </div>

                <button
                  onClick={handleNext}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
                >
                  View Final Results
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
