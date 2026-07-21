'use client'

import { ScanStep } from '@/lib/types'

interface ScanStepIndicatorProps {
  currentStep: ScanStep
  scannedData: {
    nik?: string
    machine?: string
    bobbinNr?: string
  }
}

const steps: { key: ScanStep; label: string; icon: string }[] = [
  { key: 'nik', label: 'NIK', icon: '👤' },
  { key: 'machine', label: 'Mesin', icon: '⚙️' },
  { key: 'bobbin', label: 'Bobbin', icon: '🔘' },
  { key: 'manual', label: 'Input', icon: '✏️' },
  { key: 'complete', label: 'Selesai', icon: '✅' },
]

export default function ScanStepIndicator({ currentStep, scannedData }: ScanStepIndicatorProps) {
  const currentIndex = steps.findIndex((s) => s.key === currentStep)

  const getStatus = (index: number) => {
    if (index < currentIndex) return 'completed'
    if (index === currentIndex) return 'current'
    return 'pending'
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-medium text-gray-600 mb-3">Progress Scan</h3>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const status = getStatus(index)
          const isLast = index === steps.length - 1

          // Get scanned value for display
          let value = ''
          if (step.key === 'nik') value = scannedData.nik || ''
          if (step.key === 'machine') value = scannedData.machine || ''
          if (step.key === 'bobbin') value = scannedData.bobbinNr || ''

          return (
            <div key={step.key} className="flex items-center">
              <div className="flex flex-col items-center">
                {/* Circle */}
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
                    status === 'completed'
                      ? 'bg-green-500 text-white'
                      : status === 'current'
                      ? 'bg-blue-500 text-white ring-4 ring-blue-200'
                      : 'bg-gray-200 text-gray-400'
                  }`}
                >
                  {status === 'completed' ? '✓' : step.icon}
                </div>

                {/* Label */}
                <div className="mt-1 text-xs font-medium text-center">
                  <span
                    className={
                      status === 'completed'
                        ? 'text-green-600'
                        : status === 'current'
                        ? 'text-blue-600'
                        : 'text-gray-400'
                    }
                  >
                    {step.label}
                  </span>
                </div>

                {/* Value */}
                {value && (
                  <div className="text-xs text-gray-500 max-w-[60px] truncate">{value}</div>
                )}
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={`w-8 h-1 mx-1 rounded ${
                    index < currentIndex ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
