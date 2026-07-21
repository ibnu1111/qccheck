import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getStartOfDay, getEndOfDay, formatTime } from '@/lib/utils'

// GET /api/progress - Get QC progress for today
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    const targetDate = date ? new Date(date) : new Date()

    const scans = await prisma.scan.findMany({
      where: {
        createdAt: {
          gte: getStartOfDay(targetDate),
          lte: getEndOfDay(targetDate),
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // Group by machine + nama untuk tampilan progress
    const progressMap = new Map<string, {
      machine: string
      nama: string
      subBy: string
      scans: {
        time: string
        alignment: string
        sudut?: number
        susut?: number
      }[]
    }>()

    scans.forEach((scan) => {
      const key = `${scan.machine}-${scan.nama || scan.nik}`
      const existing = progressMap.get(key)

      if (existing) {
        existing.scans.push({
          time: formatTime(scan.createdAt),
          alignment: scan.alignment,
          sudut: scan.sudut || undefined,
          susut: scan.susut || undefined,
        })
      } else {
        progressMap.set(key, {
          machine: scan.machine,
          nama: scan.nama || 'Unknown',
          subBy: scan.nik,
          scans: [{
            time: formatTime(scan.createdAt),
            alignment: scan.alignment,
            sudut: scan.sudut || undefined,
            susut: scan.susut || undefined,
          }],
        })
      }
    })

    // Get counters per bobbin
    const bobbinCounters = new Map<string, number>()
    scans.forEach((scan) => {
      const count = bobbinCounters.get(scan.bobbinNr) || 0
      bobbinCounters.set(scan.bobbinNr, count + 1)
    })

    return NextResponse.json({
      success: true,
      data: {
        progress: Array.from(progressMap.values()),
        counters: Object.fromEntries(bobbinCounters),
        totalScans: scans.length,
      },
    })
  } catch (error) {
    console.error('Error fetching progress:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil progress' },
      { status: 500 }
    )
  }
}
