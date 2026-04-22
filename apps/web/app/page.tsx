import React from 'react'
import { fetchServices, fetchActiveOutages } from '../lib/api'
import { ServiceCard } from '../components/ServiceCard'
import { LiveTicker } from '../components/LiveTicker'

export const revalidate = 10

export default async function HomePage() {
  const [servicesData, outagesData] = await Promise.all([
    fetchServices().catch(() => ({ data: [] })),
    fetchActiveOutages().catch(() => ({ data: [] }))
  ])

  const services = servicesData.data || []
  const outages = outagesData.data || []

  const featured = services.filter(s => s.is_featured)
  const other = services.filter(s => !s.is_featured)

  return (
    <>
      {outages.length > 0 && <LiveTicker outages={outages} />}
      
      <div className="max-w-7xl mx-auto px-4 pt-16 pb-24">
        <div className="max-w-3xl mb-16">
          <h1 className="text-5xl md:text-7xl font-disp font-extrabold text-ink tracking-tight mb-6 leading-none">
            Is it just you?<br/>
            <span className="text-accent">Or is it down?</span>
          </h1>
          <p className="text-xl text-muted">
            Real-time, crowdsourced outage detection for India's digital infrastructure. One tap. Zero login.
          </p>
        </div>

        <div className="mb-16">
          <div className="flex items-center justify-between mb-8 border-b-2 border-ink pb-4">
            <h2 className="text-2xl font-disp font-bold uppercase tracking-widest">Featured Services</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.map(service => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
            <h2 className="text-xl font-disp font-bold uppercase tracking-widest">More Services</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {other.map(service => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
