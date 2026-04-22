import Fastify from 'fastify'
import cors from '@fastify/cors'
import { initSocket } from './socket/handlers'
import servicesRoutes from './routes/services'
import votesRoutes from './routes/votes'
import outagesRoutes from './routes/outages'
import { startVoteBatcher } from './workers/voteBatcher'
import { startOutageDetector } from './workers/outageDetector'
import { getDb } from './lib/db'
import { getRedis } from './lib/redis'

const app = Fastify({ logger: true })

app.register(cors, {
  origin: '*'
})

// Register API Routes
app.register(servicesRoutes, { prefix: '/v1/services' })
app.register(votesRoutes, { prefix: '/v1/services' })
app.register(outagesRoutes, { prefix: '/v1/outages' })

app.get('/health', async () => ({ status: 'ok' }))

const start = async () => {
  try {
    // Ensure DB and Redis are connected before starting
    await getDb().query('SELECT 1')
    await getRedis()

    await app.ready()
    const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001
    
    // Attach Socket.io to Fastify server
    initSocket(app.server)
    
    await app.listen({ port, host: '0.0.0.0' })
    console.log(`[Server] API & WebSocket listening on port ${port}`)
    
    // Start background workers
    startVoteBatcher()
    startOutageDetector()
    
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
