import { getRedis } from '../lib/redis'
import { getDb } from '../lib/db'
import { getIo } from '../socket/handlers'
import type { StatsUpdatePayload } from '../../../../packages/shared/types'

const BATCH_SIZE = 500
const FLUSH_INTERVAL_MS = 3000

export function startVoteBatcher() {
  setInterval(async () => {
    try {
      await processBatch()
    } catch (err) {
      console.error('[VoteBatcher] Error:', err)
    }
  }, FLUSH_INTERVAL_MS)
  
  console.log('[VoteBatcher] Started batch processing every 3s')
}

async function processBatch() {
  const redis = await getRedis()
  
  // We pop up to BATCH_SIZE items from the queue
  const votesRaw: string[] = []
  for (let i = 0; i < BATCH_SIZE; i++) {
    const item = await redis.rPop('votes:queue')
    if (!item) break
    votesRaw.push(item)
  }

  if (votesRaw.length === 0) return

  const votes = votesRaw.map(v => JSON.parse(v))
  
  // 1. Bulk insert into Postgres
  const db = getDb()
  const values: any[] = []
  const placeholders: string[] = []
  
  let paramIdx = 1
  for (const v of votes) {
    placeholders.push(`($${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++}, $${paramIdx++})`)
    values.push(v.service_id, v.ip_hash, v.state_code, v.city, v.is_down, v.created_at)
  }

  const sql = `
    INSERT INTO votes (service_id, ip_hash, state_code, city, is_down, created_at)
    VALUES ${placeholders.join(', ')}
  `

  await db.query(sql, values)
  
  // 2. Broadcast updates to WebSockets
  // Group by slug to emit one update per service
  const slugs = new Set<string>(votes.map(v => v.slug))
  const io = getIo()
  if (!io) return

  // Instead of querying DB heavily for every broadcast, we do a lightweight estimation or query the continuous aggregate view.
  // Because the continuous aggregate view might not be updated within milliseconds, we can do a direct query on votes for recent counts
  
  for (const slug of slugs) {
    const sRes = await db.query('SELECT id FROM services WHERE slug = $1', [slug])
    if(sRes.rows.length === 0) continue
    const serviceId = sRes.rows[0].id

    // Fetch live stats (last 5min, 1hr) for broadcast
    const statsRes = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE is_down = true AND created_at >= NOW() - INTERVAL '5 minutes') as reports_5m,
        COUNT(*) FILTER (WHERE is_down = true AND created_at >= NOW() - INTERVAL '1 hour') as reports_1h
      FROM votes
      WHERE service_id = $1 AND created_at >= NOW() - INTERVAL '1 hour'
    `, [serviceId])

    const reports_last_5min = parseInt(statsRes.rows[0].reports_5m || '0', 10)
    const reports_last_1hr = parseInt(statsRes.rows[0].reports_1h || '0', 10)

    let status: 'ok' | 'degraded' | 'outage' = 'ok'
    if (reports_last_5min > 50) status = 'outage'
    else if (reports_last_5min > 10) status = 'degraded'

    // Get top states
    const statesRes = await db.query(`
      SELECT state_code, COUNT(*) as c
      FROM votes 
      WHERE service_id = $1 AND is_down = true AND state_code IS NOT NULL AND created_at >= NOW() - INTERVAL '5 minutes'
      GROUP BY state_code
      ORDER BY c DESC
      LIMIT 3
    `, [serviceId])

    const top_states = statesRes.rows.map(r => r.state_code)

    const payload: StatsUpdatePayload = {
      slug,
      reports_last_5min,
      reports_last_1hr,
      status,
      delta_pct: 0, // calculate if needed against baseline
      top_states
    }

    io.to(`service:${slug}`).emit('stats_update', payload)
  }
}
