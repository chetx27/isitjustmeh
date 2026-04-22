import { Server as SocketIOServer } from 'socket.io'
import type { Server } from 'http'
import type { SocketSubscribePayload } from '../../../../packages/shared/types'

let ioInstance: SocketIOServer | null = null

export function initSocket(httpServer: Server) {
  ioInstance = new SocketIOServer(httpServer, {
    cors: {
      origin: '*', // In production, restrict to frontend URL
      methods: ['GET', 'POST']
    }
  })

  ioInstance.on('connection', (socket) => {
    socket.on('subscribe', (payload: SocketSubscribePayload) => {
      if (payload?.slug) {
        socket.join(`service:${payload.slug}`)
      }
    })
    
    socket.on('unsubscribe', (payload: SocketSubscribePayload) => {
      if (payload?.slug) {
        socket.leave(`service:${payload.slug}`)
      }
    })
  })

  return ioInstance
}

export function getIo() {
  return ioInstance
}
