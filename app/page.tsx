'use client'

import { useState, useCallback, useEffect } from 'react'
import Scanner from '@/components/Scanner'
import ManualInput from '@/components/ManualInput'
import ScanStepIndicator from '@/components/ScanStepIndicator'
import CounterBadge from '@/components/CounterBadge'
import QCProgressTable from '@/components/QCProgressTable'
import type { ScanData, ScanRecord, ScanCounter, ScanStep } from '@/lib/types'

// Helper: Parse barcode dengan smart detection
// Format 1: "Nama NIK" (kartu pink) -> "Putri Naura 1947" atau "Putri/1947"
// Format 2: "Machine" (Code 128) -> "440" atau "F A2620-BW525118"
// Format 3: "Bobbin" (Code 128) -> "IL26022822"
function parseBarcode(raw: string, type: 'nik' | 'machine' | 'bobbin' | 'subBy'): {
  value: string
  extra?: string
} {
  const trimmed = raw.trim()

  if (type === 'nik') {
    // Format: "Nama NIK" atau "Nama/NIK" atau "Nama-NIK"
    // Pisahkan dengan / atau - atau spasi (ambil digit terakhir sebagai NIK)
    const partsBySlash = trimmed.split('/')
    if (partsBySlash.length >= 2) {
      return { value: partsBySlash[1].trim(), extra: partsBySlash[0].trim() }
    }

    const partsByDash = trimmed.split('-')
    if (partsBySlash.length === 1 && partsByDash.length >= 2) {
      // Cek apakah bagian terakhir adalah angka (NIK)
      const lastPart = partsByDash[partsByDash.length - 1]
      if (/^\d+$/.test(lastPart)) {
        const nama = partsByDash.slice(0, -1).join('-').trim()
        return { value: lastPart, extra: nama }
      }
    }

    // Cari pattern digit NIK di akhir string
    const match = trimmed.match(/^(.+?)\s+(\d+)$/)
    if (match) {
      return { value: match[2], extra: match[1].trim() }
    }

    // Cek apakah seluruh string adalah angka
    if (/^\d+$/.test(trimmed)) {
      return { value: trimmed }
    }

    // Default: anggap semua sebagai NIK
    return { value: trimmed }
  }

  // Machine dan Bobbin: simpan apa adanya
  return { value: trimmed }
}

export default function HomePage() {
  // State
  const [scanStep, setScanStep] = useState<ScanStep>('nik')
  const [scannedData, setScannedData] = useState<Partial<ScanData>>({})
  const [counters, setCounters] = useState<ScanCounter[]>([])
  const [recentScans, setRecentScans] = useState<ScanRecord[]>([])
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Show toast notification
  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  // Handle scan result dengan smart barcode parsing
  const handleScan = useCallback((result: string) => {
    console.log('Scanned:', result)

    let nextStep: ScanStep = scanStep
    let toastMsg = ''

    setScannedData((prev) => {
      const updated = { ...prev }

      switch (scanStep) {
        case 'nik': {
          const { value, extra } = parseBarcode(result, 'nik')
          updated.nik = value
          updated.nama = extra
          nextStep = 'machine'
          toastMsg = extra
            ? `NIK ${value} - ${extra} berhasil discan`
            : `NIK ${value} berhasil discan`
          break
        }
        case 'machine': {
          const { value } = parseBarcode(result, 'machine')
          updated.machine = value
          nextStep = 'bobbin'
          toastMsg = `Mesin ${value} berhasil discan`
          break
        }
        case 'bobbin': {
          const { value } = parseBarcode(result, 'bobbin')
          updated.bobbinNr = value
          nextStep = 'subBy'
          toastMsg = `Bobbin ${value} berhasil discan`
          break
        }
        case 'subBy': {
          const { value, extra } = parseBarcode(result, 'subBy')
          updated.subBy = value
          if (extra) updated.nama = extra
          nextStep = 'manual'
          toastMsg = `Submitter ${value} berhasil discan`
          break
        }
      }

      return updated
    })

    if (toastMsg) showToast(toastMsg, 'success')
    if (nextStep !== scanStep) setScanStep(nextStep)
  }, [scanStep, showToast])

  // Handle manual input submission
  const handleManualSubmit = async (data: ScanData) => {
    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (result.success) {
        showToast('Data berhasil disimpan!', 'success')
        setScanStep('complete')
        setRefreshTrigger((prev) => prev + 1)

        // Update counters
        if (result.counter) {
          setCounters((prev) => {
            const existing = prev.findIndex(
              (c) => c.bobbinNr === data.bobbinNr
            )
            if (existing >= 0) {
              const updated = [...prev]
              updated[existing] = {
                ...updated[existing],
                count: result.counter.count,
              }
              return updated
            } else {
              return [
                ...prev,
                {
                  nik: data.nik,
                  bobbinNr: data.bobbinNr,
                  machine: data.machine,
                  count: result.counter.count,
                  maxCount: 4,
                },
              ]
            }
          })
        }

        // Add to recent scans
        setRecentScans((prev) => [
          {
            ...data,
            id: result.data.id,
            createdAt: result.data.createdAt,
          },
          ...prev.slice(0, 4),
        ])

        // Reset after 2 seconds
        setTimeout(() => {
          resetScan()
        }, 2000)
      } else {
        showToast(result.error || 'Gagal menyimpan data', 'error')
      }
    } catch (error) {
      console.error('Error submitting scan:', error)
      showToast('Terjadi kesalahan koneksi', 'error')
    }
  }

  // Reset scan flow
  const resetScan = () => {
    setScannedData({})
    setScanStep('nik')
  }

  // Cancel manual input
  const handleCancel = () => {
    setScanStep('subBy')
  }

  // SSE for real-time updates
  useEffect(() => {
    let eventSource: EventSource | null = null
    let reconnectTimeout: NodeJS.Timeout

    const connect = () => {
      eventSource = new EventSource('/api/sse')

      eventSource.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          if (message.type === 'new_scan') {
            // Update counters from SSE
            const data = message.data
            if (data.counter) {
              setCounters((prev) => {
                const existing = prev.findIndex(
                  (c) => c.bobbinNr === data.counter.bobbinNr
                )
                if (existing >= 0) {
                  const updated = [...prev]
                  updated[existing] = {
                    ...updated[existing],
                    count: data.counter.count,
                  }
                  return updated
                } else {
                  return [...prev]
                }
              })
            }
          }
        } catch {
          // Ignore parse errors
        }
      }

      eventSource.onerror = () => {
        eventSource?.close()
        reconnectTimeout = setTimeout(connect, 5000)
      }
    }

    connect()

    return () => {
      eventSource?.close()
      clearTimeout(reconnectTimeout)
    }
  }, [])

  return (
    <main className="min-h-screen pb-8">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white sticky top-0 z-10 shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">QC Checking</h1>
              <p className="text-blue-200 text-sm">
                {new Date().toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-200">Total Scan</div>
              <div className="text-2xl font-bold">
                {counters.reduce((sum, c) => sum + c.count, 0)}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg animate-fadeIn ${
            toast.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            <span>{toast.type === 'success' ? '✓' : '✗'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Counter Badge */}
        {counters.length > 0 && (
          <div>
            <h2 className="text-sm font-medium text-gray-600 mb-2">
              Progress Bobbin Hari Ini
            </h2>
            <CounterBadge counters={counters} />
          </div>
        )}

        {/* Step Indicator */}
        <ScanStepIndicator
          currentStep={scanStep}
          scannedData={{
            nik: scannedData.nik,
            machine: scannedData.machine,
            bobbinNr: scannedData.bobbinNr,
            subBy: scannedData.subBy,
          }}
        />

        {/* Scan Area / Manual Input */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gray-800 px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              {scanStep === 'complete' ? (
                <>
                  <svg
                    className="w-5 h-5 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span>Scan Selesai - Data Tersimpan</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                    />
                  </svg>
                  <span>
                    {scanStep === 'nik' && 'Scan NIK / Kartu Operator'}
                    {scanStep === 'machine' && 'Scan Kode Mesin'}
                    {scanStep === 'bobbin' && 'Scan Nomor Bobbin'}
                    {scanStep === 'subBy' && 'Scan NIK Submitter (QC)'}
                    {scanStep === 'manual' && 'Input Data QC Manual'}
                  </span>
                </>
              )}
            </div>
          </div>

          <div className="p-4">
            {scanStep === 'complete' ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Data Berhasil Disimpan!
                </h3>
                <p className="text-gray-500 mb-4">
                  Scan berikutnya akan otomatis dalam{' '}
                  <span className="font-mono countdown">2</span> detik...
                </p>
                <button
                  onClick={resetScan}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Scan Baru
                </button>
              </div>
            ) : scanStep === 'manual' ? (
              <ManualInput
                onSubmit={handleManualSubmit}
                onCancel={handleCancel}
                scannedData={scannedData}
              />
            ) : (
              <Scanner onScan={handleScan} />
            )}
          </div>
        </div>

        {/* QC Progress Table */}
        <QCProgressTable refreshTrigger={refreshTrigger} />
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between text-xs text-gray-500">
          <span>QC Checking App v1.0</span>
          <span>© 2026 JOYKO</span>
        </div>
      </footer>
    </main>
  )
}