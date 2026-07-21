'use client'

import { ScanCounter } from '@/lib/types'

interface CounterBadgeProps {
  counters: ScanCounter[]
}

export default function CounterBadge({ counters }: CounterBadgeProps) {
  if (counters.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {counters.map((counter, idx) => (
        <div
          key={`${counter.bobbinNr}-${idx}`}
          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
            counter.count >= counter.maxCount
              ? 'bg-green-100 text-green-800 border border-green-300'
              : counter.count >= counter.maxCount / 2
              ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
              : 'bg-blue-100 text-blue-800 border border-blue-300'
          }`}
        >
          <span className="text-xs opacity-75">Bobbin:</span>
          <span className="font-mono">{counter.bobbinNr.slice(-8)}</span>
          <span className="text-gray-400">|</span>
          <span
            className={`font-bold ${
              counter.count >= counter.maxCount ? 'text-green-600' : 'text-blue-600'
            }`}
          >
            {counter.count}/{counter.maxCount}
          </span>
          {counter.count >= counter.maxCount && <span>✓</span>}
        </div>
      ))}
    </div>
  )
}
