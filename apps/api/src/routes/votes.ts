import type { FastifyPluginAsync } from 'fastify'
import { query } from '../lib/db'
import { extractClientIp, hashIp, getGeoInfo } from '../lib/geoip'
import { checkVoteRateLimit } from '../lib/rateLimiter'
import { redisSet } from '../lib/redis'
import type { VotePayload, VoteResponse } from '../../../../packages/shared/types'

const votesRoutes: FastifyPluginAsync = async (fastify) => {

  // POST /services/:slug/vote
  fastify.post<{ Params: { slug: string }; Body: VotePayload }>('/:slug/vote', async (req, reply) => {
    const { slug } = req.params
    const { is_down } = req.body

    if (typeof is_down !== 'boolean') {
      return reply.code(400).send({ error: 'is_down must be a boolean' })
    }

    // Identify user
    const rawIp = extractClientIp(req.headers, req.ip)
    const ipHash = hashIp(rawIp)

    // Rate Limit (1 vote per 10 mins per service)
    const allowed = await checkVoteRateLimit(ipHash, slug, 10)
    if (!allowed) {
      return reply.code(429).send({ error: 'Already voted recently' })
    }

    // Get Geo info
    const geo = getGeoInfo(req.headers as Record<string, string>)

    // Validate service exists and get its ID
    const sRes = await query<{ id: string }>('SELECT id FROM services WHERE slug = $1', [slug])
    if (sRes.rows.length === 0) {
      return reply.code(404).send({ error: 'Service not found' })
    }
    const serviceId = sRes.rows[0].id

    // Instead of directly writing to DB which can be slow under heavy load,
    // we could push to BullMQ / Redis. For simplicity but high perf, we will 
    // enqueue into a Redis List to be batch-processed by a worker.
    
    const voteData = {
      service_id: serviceId,
      slug, // adding slug to help socket broadcaster
      ip_hash: ipHash,
      state_code: geo.state_code,
      city: geo.city,
      is_down,
      created_at: new Date().toISOString()
    }

    const { getRedis } = await import('../lib/redis')
    const redis = await getRedis()
    await redis.lPush('votes:queue', JSON.stringify(voteData))

    // Invalidate caches
    // A more precise invalidation would just mark it dirty, but we can do a simple expiry drop
    await redis.del(`api:service:${slug}`)
    await redis.del(`api:service:${slug}:map`)

    return { 
      success: true, 
      message: 'Vote recorded',
      current_status: 'ok', // will be pushed via socket later
      reports_last_5min: 0 // real number updated via socket
    } as VoteResponse
  })

}

export default votesRoutes
