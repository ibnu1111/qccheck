// SSE broadcast storage and functions (separate file)

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

export function addSSEClient(controller: ReadableStreamDefaultController) {
  sseClients.add(controller)
}

export function removeSSEClient(controller: ReadableStreamDefaultController) {
  sseClients.delete(controller)
}

export { sseClients }
