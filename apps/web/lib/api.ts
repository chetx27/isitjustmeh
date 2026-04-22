import type { 
  ServiceWithStats, 
  ServiceHistory, 
  ServiceMapData, 
  OutageEvent, 
  PaginatedResponse,
  VoteResponse 
} from '../../../packages/shared/types'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/v1'

export async function fetchServices(category?: string): Promise<PaginatedResponse<ServiceWithStats>> {
  const url = new URL(`${API_BASE}/services`)
  if (category) url.searchParams.set('category', category)
  const res = await fetch(url.toString(), { next: { revalidate: 10 } })
  if (!res.ok) throw new Error('Failed to fetch services')
  return res.json()
}

export async function fetchService(slug: string): Promise<ServiceWithStats> {
  const res = await fetch(`${API_BASE}/services/${slug}`, { next: { revalidate: 5 } })
  if (!res.ok) throw new Error('Failed to fetch service')
  return res.json()
}

export async function fetchServiceHistory(slug: string): Promise<ServiceHistory> {
  const res = await fetch(`${API_BASE}/services/${slug}/history`, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error('Failed to fetch history')
  return res.json()
}

export async function fetchServiceMap(slug: string): Promise<ServiceMapData> {
  const res = await fetch(`${API_BASE}/services/${slug}/map`, { next: { revalidate: 30 } })
  if (!res.ok) throw new Error('Failed to fetch map data')
  return res.json()
}

export async function fetchActiveOutages(): Promise<{ data: OutageEvent[] }> {
  const res = await fetch(`${API_BASE}/outages/active`, { next: { revalidate: 10 } })
  if (!res.ok) throw new Error('Failed to fetch outages')
  return res.json()
}

export async function fetchRecentOutages(): Promise<{ data: OutageEvent[] }> {
  const res = await fetch(`${API_BASE}/outages/recent`, { next: { revalidate: 60 } })
  if (!res.ok) throw new Error('Failed to fetch recent outages')
  return res.json()
}

export async function submitVote(slug: string, isDown: boolean): Promise<VoteResponse> {
  const res = await fetch(`${API_BASE}/services/${slug}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ is_down: isDown })
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Failed to vote')
  }
  return res.json()
}

export async function searchServices(q: string): Promise<{ data: ServiceWithStats[] }> {
  const res = await fetch(`${API_BASE}/services/search?q=${encodeURIComponent(q)}`)
  if (!res.ok) throw new Error('Failed to search')
  return res.json()
}
