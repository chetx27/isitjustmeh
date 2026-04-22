'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { StatusBadge } from './StatusBadge'
import { LiveCounter } from './LiveCounter'
import type { ServiceWithStats } from '../../../packages/shared/types'

export function ServiceCard({ service }: { service: ServiceWithStats }) {
  return (
    <Link href={`/service/${service.slug}`} className="block group">
      <motion.div 
        whileHover={{ y: -2 }}
        className="border border-border bg-surface p-5 transition-colors group-hover:border-accent"
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-xl font-disp font-bold text-ink leading-none mb-1">
              {service.name}
            </h3>
            <span className="text-sm text-muted capitalize">{service.category}</span>
          </div>
          <StatusBadge status={service.status} />
        </div>
        
        <div className="flex items-end justify-between">
          <div>
            <div className="text-3xl font-disp font-extrabold text-ink leading-none">
              <LiveCounter value={service.reports_last_5min} />
            </div>
            <div className="text-sm text-muted mt-1">reports (5m)</div>
          </div>
          {/* We would render HistorySparkline here if we had data prefetched for the list */}
          <div className="text-right">
            <div className="text-lg font-disp font-bold text-ink opacity-80">
              <LiveCounter value={service.reports_last_1hr} />
            </div>
            <div className="text-xs text-muted mt-1">reports (1h)</div>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
