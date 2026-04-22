import type { FastifyPluginAsync } from 'fastify'
import { query } from '../lib/db'
import { withCache } from '../lib/redis'
import type { 
  Service, 
  ServiceWithStats, 
  ServiceHistory, 
  ServiceMapData,
  PaginatedResponse,
  SuggestPayload,
  SuggestResponse,
  TimeSeriesPoint
} from '../../../../packages/shared/types'

const servicesRoutes: FastifyPluginAsync = async (fastify) => {
  
  // GET /services
  fastify.get('/', async (req, reply) => {
    const { page = 1, limit = 50, category } = req.query as { page?: number; limit?: number; category?: string }
    const offset = (page - 1) * limit

    const cacheKey = `api:services:${page}:${limit}:${category || 'all'}`
    const result = await withCache(cacheKey, 10, async () => {
      let sql = 'SELECT * FROM services'
      const params: any[] = []

      if (category) {
        sql += ' WHERE category = $1'
        params.push(category)
      }
      
      sql += ` ORDER BY is_featured DESC, name ASC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
      params.push(limit, offset)

      const countSql = category ? 'SELECT COUNT(*) FROM services WHERE category = $1' : 'SELECT COUNT(*) FROM services'
      const countParams = category ? [category] : []

      const [servicesRes, countRes] = await Promise.all([
        query<Service>(sql, params),
        query<{ count: string }>(countSql, countParams)
      ])

      const total = parseInt(countRes.rows[0].count, 10)

      // Fetch live stats from redis or DB view for these services (simplified to mock data logic for now, in real life you'd join with stats view)
      // For performance we could fetch the last 5 min counts from votes_per_minute
      const slugs = servicesRes.rows.map(s => s.slug)
      
      let enhancedServices: ServiceWithStats[] = []
      
      if (slugs.length > 0) {
        const statsSql = `
          SELECT service_id, 
                 SUM(down_count) as reports_5m 
          FROM votes_per_minute 
          WHERE bucket >= NOW() - INTERVAL '5 minutes'
            AND service_id IN (SELECT id FROM services WHERE slug = ANY($1))
          GROUP BY service_id
        `
        const statsRes = await query<{service_id: string, reports_5m: string}>(statsSql, [slugs])
        const statsMap = new Map(statsRes.rows.map(r => [r.service_id, parseInt(r.reports_5m, 10)]))
        
        enhancedServices = servicesRes.rows.map(s => {
          const reports = statsMap.get(s.id) || 0
          return {
            ...s,
            reports_last_5min: reports,
            reports_last_1hr: reports * 12, // approx for now
            status: reports > 50 ? 'outage' : (reports > 10 ? 'degraded' : 'ok'),
            delta_pct: 0,
            top_states: []
          }
        })
      }

      return {
        data: enhancedServices,
        total,
        page: Number(page),
        page_size: Number(limit),
        has_more: offset + servicesRes.rows.length < total
      } as PaginatedResponse<ServiceWithStats>
    })

    return result
  })

  // GET /services/search
  fastify.get('/search', async (req, reply) => {
    const { q } = req.query as { q: string }
    if (!q) return { data: [] }
    
    // Instead of actual Meilisearch (which we can implement if needed), we do a quick ilike query for dev
    const res = await query<Service>(
      'SELECT * FROM services WHERE name ILIKE $1 OR slug ILIKE $1 LIMIT 10', 
      [`%${q}%`]
    )
    return { data: res.rows }
  })

  // POST /services/suggest
  fastify.post('/suggest', async (req, reply) => {
    const payload = req.body as SuggestPayload
    // Basic validation
    if (!payload.name || !payload.category) {
      return reply.code(400).send({ error: 'Name and category are required' })
    }

    // Just insert into DB (or a suggestions table)
    await query(
      'INSERT INTO service_suggestions (name, url, category, description) VALUES ($1, $2, $3, $4)',
      [payload.name, payload.url || '', payload.category, payload.description || '']
    )

    return { success: true, message: 'Suggestion received' } as SuggestResponse
  })

  // GET /services/:slug
  fastify.get('/:slug', async (req, reply) => {
    const { slug } = req.params as { slug: string }
    
    const cacheKey = `api:service:${slug}`
    const result = await withCache(cacheKey, 5, async () => {
      const res = await query<Service>('SELECT * FROM services WHERE slug = $1', [slug])
      if (res.rows.length === 0) return null
      
      const s = res.rows[0]
      const statsRes = await query<{reports_5m: string, reports_1h: string}>(`
        SELECT 
          COALESCE(SUM(down_count) FILTER (WHERE bucket >= NOW() - INTERVAL '5 minutes'), 0) as reports_5m,
          COALESCE(SUM(down_count) FILTER (WHERE bucket >= NOW() - INTERVAL '1 hour'), 0) as reports_1h
        FROM votes_per_minute 
        WHERE service_id = $1
      `, [s.id])
      
      const reports_5m = parseInt(statsRes.rows[0]?.reports_5m || '0', 10)
      const reports_1h = parseInt(statsRes.rows[0]?.reports_1h || '0', 10)

      const enhanced: ServiceWithStats = {
        ...s,
        reports_last_5min: reports_5m,
        reports_last_1hr: reports_1h,
        status: reports_5m > 50 ? 'outage' : (reports_5m > 10 ? 'degraded' : 'ok'),
        delta_pct: 0,
        top_states: []
      }
      return enhanced
    })

    if (!result) return reply.code(404).send({ error: 'Service not found' })
    return result
  })

  // GET /services/:slug/history
  fastify.get('/:slug/history', async (req, reply) => {
    const { slug } = req.params as { slug: string }
    
    const cacheKey = `api:service:${slug}:history`
    const result = await withCache(cacheKey, 60, async () => {
      const serviceRes = await query<{id: string}>('SELECT id FROM services WHERE slug = $1', [slug])
      if (serviceRes.rows.length === 0) return null

      // Get last 24 hours of data in 1-hour buckets
      const sql = `
        SELECT 
          time_bucket('1 hour', bucket) AS time,
          SUM(down_count) as down_count,
          SUM(ok_count) as ok_count
        FROM votes_per_minute
        WHERE service_id = $1 AND bucket >= NOW() - INTERVAL '24 hours'
        GROUP BY time
        ORDER BY time ASC
      `
      const res = await query<TimeSeriesPoint>(sql, [serviceRes.rows[0].id])
      
      return {
        slug,
        points: res.rows.map(r => ({
          time: r.time,
          down_count: Number(r.down_count),
          ok_count: Number(r.ok_count)
        }))
      } as ServiceHistory
    })

    if (!result) return reply.code(404).send({ error: 'Service not found' })
    return result
  })

  // GET /services/:slug/map
  fastify.get('/:slug/map', async (req, reply) => {
    const { slug } = req.params as { slug: string }
    
    const cacheKey = `api:service:${slug}:map`
    const result = await withCache(cacheKey, 30, async () => {
      const serviceRes = await query<{id: string}>('SELECT id FROM services WHERE slug = $1', [slug])
      if (serviceRes.rows.length === 0) return null

      // Get last 30 mins by state
      const sql = `
        SELECT 
          state_code,
          COUNT(*) FILTER (WHERE is_down = true) as down_count,
          COUNT(*) FILTER (WHERE is_down = false) as ok_count,
          COUNT(*) as total
        FROM votes
        WHERE service_id = $1 
          AND created_at >= NOW() - INTERVAL '30 minutes'
          AND state_code IS NOT NULL
        GROUP BY state_code
      `
      const res = await query<any>(sql, [serviceRes.rows[0].id])
      
      return {
        slug,
        states: res.rows.map(r => ({
          state_code: r.state_code,
          down_count: Number(r.down_count),
          ok_count: Number(r.ok_count),
          total: Number(r.total)
        }))
      } as ServiceMapData
    })

    if (!result) return reply.code(404).send({ error: 'Service not found' })
    return result
  })
}

export default servicesRoutes
