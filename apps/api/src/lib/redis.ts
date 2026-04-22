import { createClient, type RedisClientType } from 'redis'

let client: RedisClientType | null = null
let isConnected = false

export async function getRedis(): Promise<RedisClientType> {
  if (!client) {
    client = createClient({
      url: process.env.REDIS_URL ?? 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 100, 3_000),
        connectTimeout: 5_000,
      },
    }) as RedisClientType

    client.on('error', (err) => console.error('[Redis] Client error:', err))
    client.on('connect', () => {
      isConnected = true
      console.log('[Redis] Connected')
    })
    client.on('disconnect', () => {
      isConnected = false
      console.warn('[Redis] Disconnected')
    })
  }

  if (!isConnected) {
    await client.connect()
  }

  return client
}

export async function redisGet(key: string): Promise<string | null> {
  const redis = await getRedis()
  return redis.get(key)
}

export async function redisSet(
  key: string,
  value: string,
  ttlSeconds?: number,
): Promise<void> {
  const redis = await getRedis()
  if (ttlSeconds) {
    await redis.set(key, value, { EX: ttlSeconds })
  } else {
    await redis.set(key, value)
  }
}

export async function redisSetNX(
  key: string,
  value: string,
  ttlSeconds: number,
): Promise<boolean> {
  const redis = await getRedis()
  const result = await redis.set(key, value, { NX: true, EX: ttlSeconds })
  return result === 'OK'
}

export async function redisDel(key: string): Promise<void> {
  const redis = await getRedis()
  await redis.del(key)
}

export async function redisIncr(key: string): Promise<number> {
  const redis = await getRedis()
  return redis.incr(key)
}

/** Cache-aside helper — returns parsed JSON or fetches fresh */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  const cached = await redisGet(key)
  if (cached) {
    return JSON.parse(cached) as T
  }
  const fresh = await fetcher()
  await redisSet(key, JSON.stringify(fresh), ttlSeconds)
  return fresh
}
