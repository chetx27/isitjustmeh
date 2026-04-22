import { getDb } from '../lib/db'
import { getIo } from '../socket/handlers'
import type { OutageSeverity, OutageDeclaredPayload } from '../../../../packages/shared/types'

const DETECT_INTERVAL_MS = 30_000

export function startOutageDetector() {
  setInterval(async () => {
    try {
      await detectOutages()
    } catch (err) {
      console.error('[OutageDetector] Error:', err)
    }
  }, DETECT_INTERVAL_MS)
  
  console.log('[OutageDetector] Started evaluating services every 30s')
}

async function detectOutages() {
  const db = getDb()
  const io = getIo()

  // We analyze all services that have recent activity
  // In a real app we'd fetch all active services or use a baseline.
  const activeRes = await db.query(`
    SELECT s.id, s.slug, s.name,
           COUNT(*) FILTER (WHERE is_down = true AND created_at >= NOW() - INTERVAL '5 minutes') as down_5m,
           COUNT(*) FILTER (WHERE is_down = true AND created_at >= NOW() - INTERVAL '30 minutes') as down_30m
    FROM services s
    LEFT JOIN votes v ON s.id = v.service_id AND v.created_at >= NOW() - INTERVAL '30 minutes'
    GROUP BY s.id
    HAVING COUNT(*) FILTER (WHERE is_down = true AND created_at >= NOW() - INTERVAL '5 minutes') > 10
  `)

  for (const row of activeRes.rows) {
    const down5m = parseInt(row.down_5m || '0', 10)
    const down30m = parseInt(row.down_30m || '0', 10)
    
    // Simple baseline estimation (we could query 7 day avg, but we'll approximate)
    const avgPer5m = Math.max((down30m - down5m) / 5, 1) // historical baseline in the last 30m
    const spike = down5m / avgPer5m

    let severity: OutageSeverity | 'ok' = 'ok'
    
    if (spike > 10 && down5m > 50) severity = 'critical'
    else if (spike > 5 && down5m > 20) severity = 'major'
    else if (spike > 3 && down5m > 10) severity = 'minor' // minor is degraded
    
    if (severity !== 'ok') {
      // Check if an outage event already exists
      const currentOutage = await db.query(
        'SELECT id, severity FROM outage_events WHERE service_id = $1 AND resolved_at IS NULL',
        [row.id]
      )

      const statesRes = await db.query(`
        SELECT state_code 
        FROM votes 
        WHERE service_id = $1 AND is_down = true AND created_at >= NOW() - INTERVAL '5 minutes'
        GROUP BY state_code 
        ORDER BY COUNT(*) DESC LIMIT 5
      `, [row.id])
      const affected_states = statesRes.rows.map(r => r.state_code).filter(Boolean)

      if (currentOutage.rows.length === 0) {
        // Declare new outage
        await db.query(`
          INSERT INTO outage_events (service_id, started_at, peak_reports, affected_states, severity)
          VALUES ($1, NOW(), $2, $3, $4)
        `, [row.id, down5m, affected_states, severity])

        // Broadcast
        if (io) {
          const payload: OutageDeclaredPayload = {
            slug: row.slug,
            severity,
            started_at: new Date().toISOString(),
            affected_states
          }
          io.to(`service:${row.slug}`).emit('outage_declared', payload)
        }
      } else {
        // Update existing outage peak if higher
        await db.query(`
          UPDATE outage_events 
          SET peak_reports = GREATEST(peak_reports, $2),
              severity = $3,
              affected_states = $4
          WHERE id = $1
        `, [currentOutage.rows[0].id, down5m, severity, affected_states])
      }
    } else {
      // If ok, resolve any active outage
      const currentOutage = await db.query(
        'SELECT id FROM outage_events WHERE service_id = $1 AND resolved_at IS NULL',
        [row.id]
      )

      if (currentOutage.rows.length > 0) {
        await db.query('UPDATE outage_events SET resolved_at = NOW() WHERE id = $1', [currentOutage.rows[0].id])
        // Optionally emit an "outage_resolved" event
        if (io) {
          io.to(`service:${row.slug}`).emit('outage_resolved', { slug: row.slug })
        }
      }
    }
  }
}
