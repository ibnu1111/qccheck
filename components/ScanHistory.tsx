'use client'

import { ScanStep } from './ScanStepIndicator'

interface ScanHistoryProps {
  scans: {
    id: string
    nik: string
    machine: string
    bobbinNr: string
    alignment: string
    createdAt: string
  }[]
}

export default function ScanHistory({ scans }: ScanHistoryProps) {
  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (scans.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="bg-gray-800 px-4 py-2 text-white">
        <h3 className="font-medium text-sm">Scan Terakhir</h3>
      </div>
      <div className="max-h-48 overflow-y-auto">
        <div className="divide-y divide-gray-100">
          {scans.slice(0, 5).map((scan) => (
            <div key={scan.id} className="px-4 py-2 flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    scan.alignment === 'OK' ? 'bg-green-500' : 'bg-red-500'
                  }`}
                />
                <span className="font-medium">{scan.machine}</span>
                <span className="text-gray-400">|</span>
                <span className="text-gray-600">{scan.nik}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">{formatTime(scan.createdAt)}</span>
                <span className="text-xs text-gray-400 font-mono">{scan.bobbinNr.slice(-6)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
