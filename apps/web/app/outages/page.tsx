import React from 'react'
import Link from 'next/link'
import { fetchActiveOutages, fetchRecentOutages } from '../../lib/api'

export const revalidate = 10

export default async function OutagesPage() {
  const [activeRes, recentRes] = await Promise.all([
    fetchActiveOutages().catch(() => ({ data: [] })),
    fetchRecentOutages().catch(() => ({ data: [] }))
  ])

  const active = activeRes.data || []
  const recent = recentRes.data || []

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="mb-16">
        <h1 className="text-4xl md:text-5xl font-disp font-extrabold text-ink tracking-tight mb-4 leading-none">
          Active Outages
        </h1>
        <p className="text-xl text-muted">
          Services currently experiencing major issues.
        </p>
      </div>

      <div className="space-y-6 mb-20">
        {active.length === 0 ? (
          <div className="p-8 border border-border bg-surface text-center">
            <span className="text-ok font-bold uppercase tracking-widest text-sm block mb-2">System Nominal</span>
            <p className="text-muted">No major outages detected at this time.</p>
          </div>
        ) : (
          active.map(o => (
            <div key={o.id} className="border-l-4 border-outage bg-surface p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-2xl font-disp font-bold">
                  <Link href={`/service/${o.service?.slug}`} className="hover:underline">
                    {o.service?.name}
                  </Link>
                </h3>
                <div className="text-sm text-muted mt-1 flex gap-4">
                  <span className="font-bold text-outage uppercase">{o.severity}</span>
                  <span>Started: {new Date(o.started_at).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' })} IST</span>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-xl font-bold">{o.peak_reports}</div>
                <div className="text-xs text-muted uppercase">Peak Reports</div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mb-16">
        <h2 className="text-3xl font-disp font-bold text-ink tracking-tight mb-8 border-b-2 border-ink pb-4">
          Recently Resolved
        </h2>
        
        <div className="space-y-4">
          {recent.length === 0 ? (
            <p className="text-muted">No recently resolved outages.</p>
          ) : (
            recent.map(o => {
              const durationMs = new Date(o.resolved_at!).getTime() - new Date(o.started_at).getTime()
              const durationMins = Math.round(durationMs / 60000)
              
              return (
                <div key={o.id} className="border border-border bg-surface p-5 flex items-center justify-between opacity-80">
                  <div>
                    <h4 className="font-bold">
                      <Link href={`/service/${o.service?.slug}`} className="hover:underline">
                        {o.service?.name}
                      </Link>
                    </h4>
                    <div className="text-xs text-muted mt-1">
                      {new Date(o.started_at).toLocaleDateString('en-IN')} • Duration: {durationMins}m
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 bg-green-50 text-ok text-xs font-bold uppercase rounded-sm">Resolved</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
