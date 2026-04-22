import pg from 'pg'

const { Pool } = pg

let pool: pg.Pool | null = null

export function getDb(): pg.Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 2_000,
    })

    pool.on('error', (err) => {
      console.error('[DB] Unexpected pool error:', err)
    })
  }
  return pool
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  const db = getDb()
  const start = Date.now()
  const result = await db.query<T>(text, params)
  const duration = Date.now() - start
  if (duration > 200) {
    console.warn(`[DB] Slow query (${duration}ms):`, text.slice(0, 80))
  }
  return result
}

export async function withTransaction<T>(
  fn: (client: pg.PoolClient) => Promise<T>,
): Promise<T> {
  const db = getDb()
  const client = await db.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}
