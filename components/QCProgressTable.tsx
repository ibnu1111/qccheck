'use client'

import { useEffect, useState } from 'react'
import type { ScanRecord, ScanCounter } from '@/lib/types'
import { formatTime } from '@/lib/utils'

interface QCProgressTableProps {
  refreshTrigger?: number
}

interface ProgressItem {
  machine: string
  nama: string
  subBy: string
  scans: {
    time: string
    alignment: string
    sudut?: number
    susut?: number
  }[]
}

interface ProgressResponse {
  success: boolean
  data: {
    progress: ProgressItem[]
    counters: Record<string, number>
    totalScans: number
  }
}

export default function QCProgressTable({ refreshTrigger }: QCProgressTableProps) {
  const [progress, setProgress] = useState<ProgressItem[]>([])
  const [counters, setCounters] = useState<Record<string, number>>({})
  const [totalScans, setTotalScans] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const fetchProgress = async () => {
    try {
      const res = await fetch('/api/progress')
      const data: ProgressResponse = await res.json()

      if (data.success) {
        setProgress(data.data.progress)
        setCounters(data.data.counters)
        setTotalScans(data.data.totalScans)
        setLastUpdate(new Date())
      }
    } catch (error) {
      console.error('Error fetching progress:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // SSE subscription
  useEffect(() => {
    let eventSource: EventSource | null = null
    let reconnectTimeout: NodeJS.Timeout

    const connect = () => {
      eventSource = new EventSource('/api/sse')

      eventSource.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)

          if (message.type === 'new_scan') {
            // Refresh progress when new scan arrives
            fetchProgress()
          }
        } catch {
          // Ignore parse errors
        }
      }

      eventSource.onerror = () => {
        eventSource?.close()
        // Reconnect after 5 seconds
        reconnectTimeout = setTimeout(connect, 5000)
      }
    }

    connect()

    // Initial fetch
    fetchProgress()

    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchProgress, 10000)

    return () => {
      eventSource?.close()
      clearTimeout(reconnectTimeout)
      clearInterval(interval)
    }
  }, [refreshTrigger])

  const getCheckStatus = (scans: { alignment: string }[]) => {
    return scans.map((scan, idx) => ({
      time: scan.time,
      alignment: scan.alignment,
      checkNumber: idx + 1,
    }))
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4" />
          <div className="space-y-2">
            <div className="h-12 bg-gray-200 rounded" />
            <div className="h-12 bg-gray-200 rounded" />
            <div className="h-12 bg-gray-200 rounded" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 text-white">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">QC Checking Progress</h2>
          <div className="text-sm opacity-90">
            <span className="bg-white/20 px-2 py-1 rounded mr-2">
              Total: {totalScans} scan
            </span>
            <span className="text-xs">
              Updated: {formatTime(lastUpdate)}
            </span>
          </div>
        </div>
      </div>

      {/* Counter per Bobbin */}
      <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-gray-600">Bobbin Counter:</span>
          {Object.entries(counters).map(([bobbin, count]) => (
            <span
              key={bobbin}
              className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                count >= 4
                  ? 'bg-green-100 text-green-800'
                  : count >= 2
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              {bobbin}: {count}/4
            </span>
          ))}
          {Object.keys(counters).length === 0 && (
            <span className="text-sm text-gray-400 italic">Belum ada data</span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Mesin</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Nama</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Sub.By</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-600" colSpan={4}>
                Checks (1-4)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {progress.map((item, idx) => {
              const checks = getCheckStatus(item.scans)

              return (
                <tr key={`${item.machine}-${item.subBy}-${idx}`} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{item.machine}</td>
                  <td className="px-4 py-3">{item.nama}</td>
                  <td className="px-4 py-3">{item.subBy}</td>
                  {[1, 2, 3, 4].map((checkNum) => {
                    const check = checks.find((c) => c.checkNumber === checkNum)

                    return (
                      <td key={checkNum} className="px-2 py-3 text-center min-w-[60px]">
                        {check ? (
                          <div className="space-y-1">
                            <div
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
                                check.alignment === 'OK'
                                  ? 'bg-green-500 text-white'
                                  : 'bg-red-500 text-white'
                              }`}
                            >
                              {check.alignment === 'OK' ? '✓' : '✗'}
                            </div>
                            <div className="text-xs text-gray-500">{check.time}</div>
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-8 h-8 rounded-full border-2 border-dashed border-gray-300 text-gray-400 text-sm">
                            {checkNum}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              )
            })}

            {progress.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  <div className="flex flex-col items-center gap-2">
                    <svg
                      className="w-12 h-12 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <p>Belum ada data scan hari ini</p>
                    <p className="text-xs">Scan barcode untuk memulai</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
