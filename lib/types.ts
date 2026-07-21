// Type definitions for QC Checking App

export type ScanStep = 'nik' | 'machine' | 'bobbin' | 'manual' | 'complete'

export interface ScanData {
  nik: string
  nama?: string
  machine: string
  bobbinNr: string
  alignment: 'OK' | 'NOT_OK'
  sudut?: number
  susut?: number
  remark?: string
}

export interface ScanRecord extends ScanData {
  id: string
  createdAt: string
}

export interface DailyProgress {
  machine: string
  nama: string
  subBy: string
  jam: string
  scans: {
    time: string
    alignment: string
    sudut?: number
    susut?: number
  }[]
}

export interface ScanCounter {
  nik: string
  bobbinNr: string
  machine: string
  count: number
  maxCount: number // 4 kali per hari
}

export interface SSEEvent {
  type: 'new_scan' | 'counter_update' | 'progress_update'
  data: unknown
}
