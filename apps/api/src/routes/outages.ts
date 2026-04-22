import type { FastifyPluginAsync } from 'fastify'
import { query } from '../lib/db'
import { withCache } from '../lib/redis'
import type { OutageEvent, Service } from '../../../../packages/shared/types'

const outagesRoutes: FastifyPluginAsync = async (fastify) => {

  // GET /outages/active
  fastify.get('/active', async (req, reply) => {
    const cacheKey = `api:outages:active`
    const result = await withCache(cacheKey, 10, async () => {
      const sql = `
        SELECT o.*, 
               row_to_json(s.*) as service
        FROM outage_events o
        JOIN services s ON o.service_id = s.id
        WHERE o.resolved_at IS NULL
        ORDER BY o.started_at DESC
      `
      const res = await query<any>(sql)
      return { data: res.rows as OutageEvent[] }
    })
    return result
  })

  // GET /outages/recent
  fastify.get('/recent', async (req, reply) => {
    const cacheKey = `api:outages:recent`
    const result = await withCache(cacheKey, 60, async () => {
      const sql = `
        SELECT o.*, 
               row_to_json(s.*) as service
        FROM outage_events o
        JOIN services s ON o.service_id = s.id
        WHERE o.resolved_at IS NOT NULL
        ORDER BY o.resolved_at DESC
        LIMIT 20
      `
      const res = await query<any>(sql)
      return { data: res.rows as OutageEvent[] }
    })
    return result
  })

}

export default outagesRoutes
