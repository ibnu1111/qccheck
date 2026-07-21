'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface ScannerProps {
  onScan: (result: string) => void
  onError?: (error: string) => void
  disabled?: boolean
}

export default function Scanner({ onScan, onError, disabled }: ScannerProps) {
  const scannerRef = useRef<HTMLDivElement>(null)
  const html5QrCodeRef = useRef<unknown>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [hasCamera, setHasCamera] = useState(true)
  const [manualInput, setManualInput] = useState('')

  const startScanning = useCallback(async () => {
    if (!scannerRef.current || html5QrCodeRef.current) return

    try {
      const { Html5Qrcode } = await import('html5-qrcode')

      const html5QrCode = new Html5Qrcode('scanner-container')
      html5QrCodeRef.current = html5QrCode

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          onScan(decodedText)
        },
        () => {
          // QR code not found - ignore
        }
      )

      setIsScanning(true)
      setHasCamera(true)
    } catch (err) {
      console.error('Error starting scanner:', err)
      setHasCamera(false)
      onError?.('Tidak dapat mengakses kamera')
    }
  }, [onScan, onError])

  const stopScanning = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        const html5QrCode = html5QrCodeRef.current as { stop: () => Promise<void> }
        await html5QrCode.stop()
        html5QrCodeRef.current = null
        setIsScanning(false)
      } catch (err) {
        console.error('Error stopping scanner:', err)
      }
    }
  }, [])

  useEffect(() => {
    if (!disabled && hasCamera) {
      startScanning()
    }

    return () => {
      stopScanning()
    }
  }, [disabled, hasCamera, startScanning, stopScanning])

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualInput.trim()) {
      onScan(manualInput.trim())
      setManualInput('')
    }
  }

  return (
    <div className="space-y-4">
      {/* Camera Scanner */}
      <div className="relative">
        <div
          id="scanner-container"
          ref={scannerRef}
          className="w-full aspect-square max-w-md mx-auto bg-gray-900 rounded-lg overflow-hidden"
        />

        {/* Scanning overlay */}
        {isScanning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-48 h-48 border-2 border-blue-500 rounded-lg animate-pulse" />
          </div>
        )}

        {/* Camera indicator */}
        {isScanning && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-red-500 text-white px-2 py-1 rounded text-xs">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            REC
          </div>
        )}
      </div>

      {/* No camera fallback */}
      {!hasCamera && (
        <div className="text-center p-4 bg-yellow-50 rounded-lg">
          <p className="text-yellow-800 text-sm">
            Kamera tidak tersedia. Gunakan input manual di bawah.
          </p>
        </div>
      )}

      {/* Manual Input Fallback */}
      <form onSubmit={handleManualSubmit} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Input Manual (Fallback)
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={manualInput}
            onChange={(e) => setManualInput(e.target.value)}
            placeholder="Masukkan kode manual..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={disabled}
          />
          <button
            type="submit"
            disabled={disabled || !manualInput.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            Submit
          </button>
        </div>
      </form>

      {/* Control buttons */}
      <div className="flex gap-2 justify-center">
        <button
          onClick={isScanning ? stopScanning : startScanning}
          disabled={!hasCamera}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            isScanning
              ? 'bg-red-500 hover:bg-red-600 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          } disabled:bg-gray-300 disabled:cursor-not-allowed`}
        >
          {isScanning ? 'Stop Kamera' : 'Start Kamera'}
        </button>
      </div>
    </div>
  )
}
