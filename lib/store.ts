// Store untuk state management dengan Zustand

import { create } from 'zustand'
import type { ScanData, ScanRecord, ScanCounter } from './types'

interface ScanState {
  // Scan sequence state
  scannedData: Partial<ScanData>
  scanStep: 'nik' | 'machine' | 'bobbin' | 'manual' | 'complete'
  scanHistory: ScanRecord[]
  counters: ScanCounter[]

  // Actions
  setScanStep: (step: ScanState['scanStep']) => void
  setScanData: (data: Partial<ScanData>) => void
  addScanRecord: (record: ScanRecord) => void
  setCounters: (counters: ScanCounter[]) => void
  resetScan: () => void
}

export const useScanStore = create<ScanState>((set) => ({
  scannedData: {},
  scanStep: 'nik',
  scanHistory: [],
  counters: [],

  setScanStep: (step) => set({ scanStep: step }),

  setScanData: (data) =>
    set((state) => ({
      scannedData: { ...state.scannedData, ...data },
    })),

  addScanRecord: (record) =>
    set((state) => ({
      scanHistory: [record, ...state.scanHistory].slice(0, 50), // Keep last 50
    })),

  setCounters: (counters) => set({ counters }),

  resetScan: () =>
    set({
      scannedData: {},
      scanStep: 'nik',
    }),
}))
