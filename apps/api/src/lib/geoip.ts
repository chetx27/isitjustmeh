import crypto from 'crypto'
import type { GeoInfo } from '../../../../packages/shared/types'

export function hashIp(ip: string): string {
  // We use a daily salt so hashes change every day, further protecting privacy
  const salt = new Date().toISOString().split('T')[0]
  return crypto.createHash('sha256').update(`${ip}-${salt}`).digest('hex')
}

export function getGeoInfo(headers: Record<string, string | string[] | undefined>): GeoInfo {
  // Cloudflare injects these headers if IP Geolocation is enabled
  const stateCode = headers['cf-region-code'] as string | undefined
  const city = headers['cf-ipcity'] as string | undefined
  const country = headers['cf-ipcountry'] as string | undefined

  return {
    state_code: stateCode || null,
    city: city ? decodeURIComponent(city) : null,
    country: country || null,
  }
}

export function extractClientIp(headers: Record<string, string | string[] | undefined>, remoteAddress?: string): string {
  const cfConnectingIp = headers['cf-connecting-ip'] as string | undefined
  const xForwardedFor = headers['x-forwarded-for'] as string | undefined

  if (cfConnectingIp) {
    return cfConnectingIp
  }
  
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0].trim()
  }

  return remoteAddress || '127.0.0.1'
}
