// ─── Service ─────────────────────────────────────────────────────────────────

export type ServiceCategory =
  | 'telecom'
  | 'payments'
  | 'food'
  | 'banking'
  | 'govt'
  | 'streaming'

export type ServiceStatus = 'ok' | 'degraded' | 'outage'

export interface Service {
  id: string
  slug: string
  name: string
  category: ServiceCategory
  logo_url: string | null
  is_featured: boolean
  created_at: string
}

export interface ServiceWithStats extends Service {
  status: ServiceStatus
  reports_last_5min: number
  reports_last_1hr: number
  delta_pct: number
  top_states: string[]
}

// ─── Vote ────────────────────────────────────────────────────────────────────

export interface Vote {
  id: string
  service_id: string
  ip_hash: string
  state_code: string | null
  city: string | null
  is_down: boolean
  created_at: string
}

export interface VotePayload {
  is_down: boolean
}

export interface VoteResponse {
  success: boolean
  message: string
  current_status: ServiceStatus
  reports_last_5min: number
}

// ─── Outage ──────────────────────────────────────────────────────────────────

export type OutageSeverity = 'minor' | 'major' | 'critical'

export interface OutageEvent {
  id: string
  service_id: string
  service?: Service
  started_at: string
  resolved_at: string | null
  peak_reports: number
  affected_states: string[]
  severity: OutageSeverity
}

// ─── Stats / Time-series ─────────────────────────────────────────────────────

export interface TimeSeriesPoint {
  time: string          // ISO string, bucketed (e.g. 1-hour buckets)
  down_count: number
  ok_count: number
}

export interface ServiceHistory {
  slug: string
  points: TimeSeriesPoint[]
}

export interface StateVoteCount {
  state_code: string
  down_count: number
  ok_count: number
  total: number
}

export interface ServiceMapData {
  slug: string
  states: StateVoteCount[]
}

// ─── WebSocket events ────────────────────────────────────────────────────────

export interface StatsUpdatePayload {
  slug: string
  reports_last_5min: number
  reports_last_1hr: number
  status: ServiceStatus
  delta_pct: number
  top_states: string[]
}

export interface OutageDeclaredPayload {
  slug: string
  severity: OutageSeverity
  started_at: string
  affected_states: string[]
}

export interface SocketSubscribePayload {
  slug: string
}

// ─── API response wrappers ───────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  page_size: number
  has_more: boolean
}

export interface ApiError {
  error: string
  code?: string
  status?: number
}

// ─── Search ──────────────────────────────────────────────────────────────────

export interface SearchResult {
  slug: string
  name: string
  category: ServiceCategory
  logo_url: string | null
  status: ServiceStatus
}

// ─── Suggest ─────────────────────────────────────────────────────────────────

export interface SuggestPayload {
  name: string
  url: string
  category: ServiceCategory
  description?: string
}

export interface SuggestResponse {
  success: boolean
  message: string
}

// ─── Geo ─────────────────────────────────────────────────────────────────────

export interface GeoInfo {
  state_code: string | null
  city: string | null
  country: string | null
}

// ─── Indian States ───────────────────────────────────────────────────────────

export const INDIA_STATES: Record<string, string> = {
  AN: 'Andaman & Nicobar',
  AP: 'Andhra Pradesh',
  AR: 'Arunachal Pradesh',
  AS: 'Assam',
  BR: 'Bihar',
  CH: 'Chandigarh',
  CT: 'Chhattisgarh',
  DL: 'Delhi',
  DN: 'Dadra & Nagar Haveli',
  GA: 'Goa',
  GJ: 'Gujarat',
  HP: 'Himachal Pradesh',
  HR: 'Haryana',
  JH: 'Jharkhand',
  JK: 'Jammu & Kashmir',
  KA: 'Karnataka',
  KL: 'Kerala',
  LA: 'Ladakh',
  LD: 'Lakshadweep',
  MH: 'Maharashtra',
  ML: 'Meghalaya',
  MN: 'Manipur',
  MP: 'Madhya Pradesh',
  MZ: 'Mizoram',
  NL: 'Nagaland',
  OD: 'Odisha',
  PB: 'Punjab',
  PY: 'Puducherry',
  RJ: 'Rajasthan',
  SK: 'Sikkim',
  TG: 'Telangana',
  TN: 'Tamil Nadu',
  TR: 'Tripura',
  UP: 'Uttar Pradesh',
  UT: 'Uttarakhand',
  WB: 'West Bengal',
}

// ─── Seed services ───────────────────────────────────────────────────────────

export interface SeedService {
  slug: string
  name: string
  category: ServiceCategory
  is_featured: boolean
}

export const SEED_SERVICES: SeedService[] = [
  // Telecom
  { slug: 'jio',        name: 'Jio',            category: 'telecom',   is_featured: true },
  { slug: 'airtel',     name: 'Airtel',          category: 'telecom',   is_featured: true },
  { slug: 'vi',         name: 'Vi (Vodafone)',   category: 'telecom',   is_featured: true },
  { slug: 'bsnl',       name: 'BSNL',            category: 'telecom',   is_featured: false },
  // Payments
  { slug: 'upi',        name: 'UPI',             category: 'payments',  is_featured: true },
  { slug: 'paytm',      name: 'Paytm',           category: 'payments',  is_featured: true },
  { slug: 'phonepe',    name: 'PhonePe',         category: 'payments',  is_featured: true },
  { slug: 'gpay',       name: 'Google Pay',      category: 'payments',  is_featured: true },
  // Food & Delivery
  { slug: 'swiggy',     name: 'Swiggy',          category: 'food',      is_featured: true },
  { slug: 'zomato',     name: 'Zomato',          category: 'food',      is_featured: true },
  { slug: 'blinkit',    name: 'Blinkit',         category: 'food',      is_featured: true },
  // Banking
  { slug: 'sbi',        name: 'SBI Net Banking', category: 'banking',   is_featured: true },
  { slug: 'hdfc',       name: 'HDFC Bank',       category: 'banking',   is_featured: false },
  { slug: 'icici',      name: 'ICICI Bank',      category: 'banking',   is_featured: false },
  // Govt / Infra
  { slug: 'irctc',      name: 'IRCTC',           category: 'govt',      is_featured: true },
  { slug: 'digilocker', name: 'DigiLocker',      category: 'govt',      is_featured: false },
  { slug: 'cowin',      name: 'CoWIN',           category: 'govt',      is_featured: false },
  // Streaming
  { slug: 'hotstar',    name: 'Hotstar',         category: 'streaming', is_featured: true },
  { slug: 'netflix',    name: 'Netflix',         category: 'streaming', is_featured: false },
  { slug: 'jiocinema',  name: 'JioCinema',       category: 'streaming', is_featured: true },
]
