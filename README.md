# Is It Just Me? 🇮🇳

> India's real-time, crowdsourced outage detection platform.
> One tap. Zero login. Instant answer.

## How it works
1. User reports "Jio is down for me" with one tap
2. We aggregate anonymous reports by service + state
3. When reports spike 5× baseline → outage declared
4. Everyone sees it in real-time via WebSocket push

## Stack
Next.js 14 · Fastify · PostgreSQL + TimescaleDB · Redis · Socket.io · Meilisearch

## Local dev
```bash
docker-compose up -d
# Setup your DB credentials and run migrations if necessary
pnpm install
pnpm dev
```

## Architecture
```
[Client] --> [Next.js (Edge)]
  | 
  | (HTTP)                 (WebSocket)
  v                            v
[Fastify API] <=========> [Socket.io]
  |
  | (enqueue vote)
  v
[Redis List] --> [VoteBatcher Worker] --> [TimescaleDB]
                                                 |
                                          [OutageDetector Worker]
                                                 |
                                         (Broadcast via Socket)
```

## Metrics (production targets)
| Metric              | Target |
|---------------------|--------|
| Votes processed/day | ~2M    |
| Avg response time   | 34ms   |
| Active WebSocket cx | ~12,000|
| Services tracked    | 150+   |

## Privacy
We do not store IP addresses. All IPs are hashed with a daily salt. We only extract broad geolocation data (state level) for regional outage heatmaps.
