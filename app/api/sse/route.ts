import { NextRequest } from 'next/server'
import { sseClients } from '@/lib/sse'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// GET /api/sse - Server-Sent Events for real-time updates
export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      // Add client to set
      sseClients.add(controller)

      // Send initial connection message
      const connectMessage = `data: ${JSON.stringify({ type: 'connected', data: { message: 'SSE connected' } })}\n\n`
      controller.enqueue(encoder.encode(connectMessage))

      // Keep-alive ping every 30 seconds
      const pingInterval = setInterval(() => {
        try {
          const ping = `data: ${JSON.stringify({ type: 'ping', data: { time: Date.now() } })}\n\n`
          controller.enqueue(encoder.encode(ping))
        } catch {
          clearInterval(pingInterval)
          sseClients.delete(controller)
        }
      }, 30000)

      // Cleanup on close
      request.signal.addEventListener('abort', () => {
        clearInterval(pingInterval)
        sseClients.delete(controller)
        try {
          controller.close()
        } catch {
          // Already closed
        }
      })
    },
    cancel() {
      // Client disconnected
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
