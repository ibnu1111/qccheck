'use client'

import { useState } from 'react'
import type { ScanData } from '@/lib/types'

interface ManualInputProps {
  onSubmit: (data: ScanData) => void
  onCancel: () => void
  scannedData: Partial<ScanData>
  disabled?: boolean
}

export default function ManualInput({
  onSubmit,
  onCancel,
  scannedData,
  disabled,
}: ManualInputProps) {
  const [alignment, setAlignment] = useState<string>('OK')
  const [sudut, setSudut] = useState<string>('')
  const [susut, setSusut] = useState<string>('')
  const [remark, setRemark] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const data: ScanData = {
        nik: scannedData.nik || '',
        nama: scannedData.nama,
        machine: scannedData.machine || '',
        bobbinNr: scannedData.bobbinNr || '',
        subBy: scannedData.subBy,
        alignment: alignment as 'OK' | 'NOT_OK',
        sudut: sudut ? parseFloat(sudut) : undefined,
        susut: susut ? parseFloat(susut) : undefined,
        remark: remark || undefined,
      }

      onSubmit(data)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Scanned Data Summary */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <h3 className="font-semibold text-gray-800">Data Scan:</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500">NIK:</span>
            <span className="ml-2 font-medium">{scannedData.nik || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500">Nama:</span>
            <span className="ml-2 font-medium">{scannedData.nama || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500">Mesin:</span>
            <span className="ml-2 font-medium">{scannedData.machine || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500">Bobbin:</span>
            <span className="ml-2 font-medium">{scannedData.bobbinNr || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500">Sub.By:</span>
            <span className="ml-2 font-medium">{scannedData.subBy || '-'}</span>
          </div>
        </div>
      </div>

      {/* Manual Input Fields */}
      <div className="space-y-4">
        {/* Alignment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Alignment (dari Papan Meja)
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setAlignment('OK')}
              disabled={disabled}
              className={`flex-1 py-3 px-4 rounded-lg font-medium border-2 transition-all ${
                alignment === 'OK'
                  ? 'bg-green-500 border-green-500 text-white'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-green-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              OK ✓
            </button>
            <button
              type="button"
              onClick={() => setAlignment('NOT_OK')}
              disabled={disabled}
              className={`flex-1 py-3 px-4 rounded-lg font-medium border-2 transition-all ${
                alignment === 'NOT_OK'
                  ? 'bg-red-500 border-red-500 text-white'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-red-300'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              NOT OK ✗
            </button>
          </div>
        </div>

        {/* Sudut */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Sudut (°) - Opsional
          </label>
          <input
            type="number"
            step="0.01"
            value={sudut}
            onChange={(e) => setSudut(e.target.value)}
            placeholder="0.00"
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={disabled}
          />
        </div>

        {/* Susut */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Susut (mm) - Opsional
          </label>
          <input
            type="number"
            step="0.01"
            value={susut}
            onChange={(e) => setSusut(e.target.value)}
            placeholder="0.00"
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={disabled}
          />
        </div>

        {/* Remark */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Remark - Opsional
          </label>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="Catatan tambahan..."
            rows={2}
            className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            disabled={disabled}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={disabled || isSubmitting}
          className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Batal
        </button>
        <button
          type="submit"
          disabled={disabled || isSubmitting}
          className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Menyimpan...
            </>
          ) : (
            'Simpan'
          )}
        </button>
      </div>
    </form>
  )
}
