'use client'

import { ScanStep } from '@/lib/types'

type StepStatus = 'completed' | 'current' | 'pending'

const STEPS: { readonly key: ScanStep; readonly label: string; readonly icon: string }[] = [
  { key: 'nik', label: 'NIK', icon: '👤' },
  { key: 'machine', label: 'Mesin', icon: '⚙️' },
  { key: 'bobbin', label: 'Bobbin', icon: '🔘' },
  { key: 'subBy', label: 'Sub.By', icon: '👮' },
  { key: 'manual', label: 'Input', icon: '✏️' },
  { key: 'complete', label: 'Selesai', icon: '✅' },
]

function getStatus(index: number, currentIndex: number): StepStatus {
  if (index < currentIndex) return 'completed'
  if (index === currentIndex) return 'current'
  return 'pending'
}

function getStepValue(stepKey: ScanStep, scannedData: ScanStepIndicatorProps['scannedData']): string {
  if (stepKey === 'nik') return scannedData.nik ?? ''
  if (stepKey === 'machine') return scannedData.machine ?? ''
  if (stepKey === 'bobbin') return scannedData.bobbinNr ?? ''
  if (stepKey === 'subBy') return scannedData.subBy ?? ''
  return ''
}

function getCircleStyle(status: StepStatus): string {
  if (status === 'completed') {
    return { background: '#22c55e', color: '#fff' }
  }
  if (status === 'current') {
    return { background: '#3b82f6', color: '#fff', boxShadow: '0 0 0 4px rgba(59,130,246,0.2)' }
  }
  return { background: '#e5e7eb', color: '#9ca3af' }
}

function getLabelColor(status: StepStatus): string {
  if (status === 'completed') return 'text-green-600'
  if (status === 'current') return 'text-blue-600'
  return 'text-gray-400'
}

interface ScanStepIndicatorProps {
  readonly currentStep: ScanStep
  readonly scannedData: {
    readonly nik?: string
    readonly machine?: string
    readonly bobbinNr?: string
    readonly subBy?: string
  }
}

export default function ScanStepIndicator({ currentStep, scannedData }: ScanStepIndicatorProps) {
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep)

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-medium text-gray-600 mb-3">Progress Scan</h3>
      <div className="flex items-center justify-between">
        {STEPS.map((step, index) => {
          const status = getStatus(index, currentIndex)
          const isLast = index === STEPS.length - 1
          const value = getStepValue(step.key, scannedData)

          return (
            <div key={step.key} className="flex items-center">
              <div className="flex flex-col items-center">
                {/* Circle */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all"
                  style={getCircleStyle(status)}
                >
                  {status === 'completed' ? '✓' : step.icon}
                </div>

                {/* Label */}
                <div className="mt-1 text-xs font-medium text-center">
                  <span className={getLabelColor(status)}>{step.label}</span>
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