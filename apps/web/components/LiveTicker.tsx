'use client'

import React from 'react'
import { motion } from 'framer-motion'
import type { OutageEvent } from '../../../packages/shared/types'

export function LiveTicker({ outages }: { outages: OutageEvent[] }) {
  if (!outages || outages.length === 0) return null

  // Duplicate items for continuous scrolling effect
  const items = [...outages, ...outages]

  return (
    <div className="w-full bg-ink text-white overflow-hidden py-3 border-b-4 border-accent relative flex items-center">
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-ink to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-ink to-transparent z-10" />
      
      <div className="flex whitespace-nowrap overflow-hidden items-center">
        <motion.div
          animate={{ x: [0, -1000] }}
          transition={{
            repeat: Infinity,
            ease: 'linear',
            duration: 20
          }}
          className="flex gap-12 font-mono text-sm tracking-wide"
        >
          {items.map((o, i) => (
            <div key={`${o.id}-${i}`} className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="font-bold text-accent">{o.service?.name || 'Unknown'}</span>
              <span>{o.severity.toUpperCase()} OUTAGE</span>
              <span className="text-white/60">Started: {new Date(o.started_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span>
              <span className="text-white/60">Peak: {o.peak_reports} reports</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
