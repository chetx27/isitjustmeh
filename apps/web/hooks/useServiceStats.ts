import { useState, useEffect } from 'react'
import { getSocket } from '../lib/socket'
import type { StatsUpdatePayload, ServiceWithStats } from '../../../packages/shared/types'

export function useServiceStats(initialData: ServiceWithStats) {
  const [stats, setStats] = useState<ServiceWithStats>(initialData)

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    socket.connect()
    socket.emit('subscribe', { slug: initialData.slug })

    const handleUpdate = (payload: StatsUpdatePayload) => {
      if (payload.slug === initialData.slug) {
        setStats(prev => ({
          ...prev,
          reports_last_5min: payload.reports_last_5min,
          reports_last_1hr: payload.reports_last_1hr,
          status: payload.status,
          delta_pct: payload.delta_pct,
          top_states: payload.top_states
        }))
      }
    }

    socket.on('stats_update', handleUpdate)

    return () => {
      socket.off('stats_update', handleUpdate)
      socket.emit('unsubscribe', { slug: initialData.slug })
    }
  }, [initialData.slug])

  return stats
}
