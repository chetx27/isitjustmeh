import React from 'react'
import { notFound } from 'next/navigation'
import { fetchService, fetchServiceHistory, fetchServiceMap } from '../../../lib/api'
import { StatusBadge } from '../../../components/StatusBadge'
import { LiveCounter } from '../../../components/LiveCounter'
import { VoteButton } from '../../../components/VoteButton'
import { HistorySparkline } from '../../../components/HistorySparkline'
import { OutageMap } from '../../../components/OutageMap'

export const revalidate = 5

export default async function ServicePage({ params }: { params: { slug: string } }) {
  let serviceData
  try {
    serviceData = await fetchService(params.slug)
  } catch (e) {
    return notFound()
  }

  const [historyRes, mapRes] = await Promise.all([
    fetchServiceHistory(params.slug).catch(() => null),
    fetchServiceMap(params.slug).catch(() => null)
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-4">
          <h1 className="text-5xl md:text-6xl font-disp font-extrabold text-ink tracking-tight">
            {serviceData.name}
          </h1>
          <StatusBadge status={serviceData.status} />
        </div>
        <p className="text-lg text-muted capitalize">Category: {serviceData.category}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Left Column: Voting and Live Stats */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-surface border border-border p-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted mb-6 border-b border-border pb-2">
              Are you having issues?
            </h2>
            <VoteButton slug={serviceData.slug} />
          </div>

          <div className="bg-surface border border-border p-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted mb-6 border-b border-border pb-2">
              Live Reports
            </h2>
            <div className="flex flex-col gap-6">
              <div>
                <div className="text-6xl font-disp font-extrabold text-ink leading-none">
                  <LiveCounter value={serviceData.reports_last_5min} />
                </div>
                <div className="text-muted mt-2 font-medium">reports in last 5 minutes</div>
              </div>
              <div>
                <div className="text-3xl font-disp font-bold text-ink/80 leading-none">
                  <LiveCounter value={serviceData.reports_last_1hr} />
                </div>
                <div className="text-muted mt-1 text-sm">reports in last hour</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Map and Chart */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-surface border border-border p-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted mb-6 border-b border-border pb-2">
              24-Hour Timeline
            </h2>
            <div className="w-full h-64">
              {historyRes && <HistorySparkline data={historyRes.points} height={256} />}
            </div>
          </div>

          <div className="bg-surface border border-border p-8">
            <h2 className="text-sm font-bold uppercase tracking-widest text-muted mb-6 border-b border-border pb-2">
              Live State Density (Last 30m)
            </h2>
            <div className="w-full h-[400px]">
              {mapRes && <OutageMap data={mapRes} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
