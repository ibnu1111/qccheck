import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getStartOfDay, getEndOfDay } from '@/lib/utils'
import type { ScanData } from '@/lib/types'

// POST /api/scan - Submit new scan data
export async function POST(request: NextRequest) {
  try {
    const body: ScanData = await request.json()

    // Validate required fields
    if (!body.nik || !body.machine || !body.bobbinNr) {
      return NextResponse.json(
        { error: 'NIK, Machine, dan BobbinNr wajib diisi' },
        { status: 400 }
      )
    }

    // Create scan record
    const scan = await prisma.scan.create({
      data: {
        nik: body.nik,
        nama: body.nama || null,
        machine: body.machine,
        bobbinNr: body.bobbinNr,
        alignment: body.alignment || 'OK',
        sudut: body.sudut || null,
        susut: body.susut || null,
        remark: body.remark || null,
      },
    })

    // Get today's scans for counter
    const todayScans = await prisma.scan.findMany({
      where: {
        bobbinNr: body.bobbinNr,
        createdAt: {
          gte: getStartOfDay(),
          lte: getEndOfDay(),
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    })

    // Broadcast to SSE clients
    broadcastSSE({
      type: 'new_scan',
      data: {
        scan,
        counter: {
          bobbinNr: body.bobbinNr,
          count: todayScans.length,
          maxCount: 4,
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: scan,
      counter: {
        bobbinNr: body.bobbinNr,
        count: todayScans.length,
        maxCount: 4,
      },
    })
  } catch (error) {
    console.error('Error creating scan:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menyimpan data' },
      { status: 500 }
    )
  }
}

// GET /api/scan - Get scans for today
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const nik = searchParams.get('nik')
    const bobbinNr = searchParams.get('bobbinNr')

    const whereClause: Parameters<typeof prisma.scan.findMany>[0]['where'] = {}

    if (date) {
      const d = new Date(date)
      whereClause.createdAt = {
        gte: getStartOfDay(d),
        lte: getEndOfDay(d),
      }
    }

    if (nik) {
      whereClause.nik = nik
    }

    if (bobbinNr) {
      whereClause.bobbinNr = bobbinNr
    }

    const scans = await prisma.scan.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      take: 100,
    })

    return NextResponse.json({ success: true, data: scans })
  } catch (error) {
    console.error('Error fetching scans:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data' },
      { status: 500 }
    )
  }
}

// SSE broadcast storage (in-memory for simplicity)
const sseClients: Set<ReadableStreamDefaultController> = new Set()

export function broadcastSSE(event: { type: string; data: unknown }) {
  const encoder = new TextEncoder()
  const message = `data: ${JSON.stringify(event)}\n\n`

  sseClients.forEach((controller) => {
    try {
      controller.enqueue(encoder.encode(message))
    } catch {
      sseClients.delete(controller)
    }
  })
}

export { sseClients }
