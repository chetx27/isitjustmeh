import React from 'react'
import type { ServiceStatus } from '../../../packages/shared/types'

const statusMap = {
  ok: { label: 'All Good', bg: 'bg-ok/10', text: 'text-ok', dot: 'bg-ok', pulse: false },
  degraded: { label: 'Degraded', bg: 'bg-degraded/10', text: 'text-degraded', dot: 'bg-degraded', pulse: true },
  outage: { label: 'Outage', bg: 'bg-outage/10', text: 'text-outage', dot: 'bg-outage', pulse: true }
}

export function StatusBadge({ status }: { status: ServiceStatus }) {
  const cfg = statusMap[status]

  return (
    <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${cfg.bg} ${cfg.text}`}>
      <span className="relative flex h-2 w-2">
        {cfg.pulse && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${cfg.dot}`}></span>
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${cfg.dot}`}></span>
      </span>
      {cfg.label}
    </div>
  )
}
