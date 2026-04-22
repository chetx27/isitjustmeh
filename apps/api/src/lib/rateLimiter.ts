import { redisSetNX, redisIncr, redisSet } from './redis'

export async function checkVoteRateLimit(
  ipHash: string,
  serviceSlug: string,
  windowMinutes = 10
): Promise<boolean> {
  const key = `vote:${ipHash}:${serviceSlug}`
  // Returns true if the key didn't exist and was set successfully
  return redisSetNX(key, '1', windowMinutes * 60)
}

export async function checkGlobalRateLimit(
  ipHash: string,
  limit = 100,
  windowSeconds = 60
): Promise<boolean> {
  const key = `rl:global:${ipHash}`
  const count = await redisIncr(key)
  
  if (count === 1) {
    // Only set TTL on the first increment to simulate a fixed window
    await redisSet(key, '1', windowSeconds)
  }
  
  return count <= limit
}
