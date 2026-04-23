// D1 Database helper for Cloudflare Workers
// Replaces Prisma for edge runtime

interface D1Result<T = unknown> {
  results: T[]
  success: boolean
  error?: string
}

interface D1Database {
  prepare(query: string): D1PreparedStatement
  batch<T = unknown>(stmts: D1PreparedStatement[]): Promise<D1Result<T>[]>
  exec(query: string): Promise<D1Result>
  dump(): Promise<ArrayBuffer>
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement
  first<T = unknown>(colName?: string): Promise<T | null>
  run(): Promise<D1Result>
  all<T = unknown>(): Promise<{ results: T[]; success: boolean }>
}

type BindValues = unknown[]

// Get D1 binding from Cloudflare request context
function getCloudflareContext(): { env: { DB: D1Database } } | null {
  try {
    // @ts-expect-error - getRequestContext is injected by @opennextjs/cloudflare
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { getRequestContext } = require('@opennextjs/cloudflare')
    return getRequestContext()
  } catch {
    return null
  }
}

// Local SQLite fallback for development
function getLocalDb() {
  if (typeof require === 'undefined') return null
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Database = require('better-sqlite3')
    return new Database('./db/custom.db')
  } catch {
    return null
  }
}

export function getD1(): D1Database {
  const ctx = getCloudflareContext()
  if (ctx?.env?.DB) return ctx.env.DB

  // Fallback to local SQLite for dev
  const localDb = getLocalDb()
  if (localDb) {
    return {
      prepare(query: string) {
        let stmt: ReturnType<typeof localDb.prepare>
        return {
          bind(...values: BindValues) {
            stmt = localDb.prepare(query)
            const keys = values.map((_, i) => `$${i + 1}`)
            const params: Record<string, unknown> = {}
            keys.forEach((k, i) => { params[k] = values[i] })
            stmt = stmt.run(...values)
            return this
          },
          async first(colName?: string) {
            const prepared = localDb.prepare(query)
            const row = prepared.get() as Record<string, unknown> | undefined
            if (!row) return null
            return (colName ? row[colName] : row) as never
          },
          async run() {
            const prepared = localDb.prepare(query)
            prepared.run()
            return { results: [], success: true }
          },
          async all() {
            const prepared = localDb.prepare(query)
            const rows = prepared.all()
            return { results: rows as unknown[], success: true }
          },
        }
      },
      batch() {
        throw new Error('Batch not supported in local SQLite fallback')
      },
      exec() {
        throw new Error('Exec not supported in local SQLite fallback')
      },
      dump() {
        throw new Error('Dump not supported in local SQLite fallback')
      },
    }
  }

  throw new Error('No database connection available. Make sure D1 is bound or run in development mode.')
}

// Helper to query D1 with typed results
export async function d1Query<T = Record<string, unknown>>(
  sql: string,
  params: BindValues = []
): Promise<T[]> {
  const d1 = getD1()
  const stmt = d1.prepare(sql).bind(...params)
  const result = await stmt.all<T>()
  return result.results
}

export async function d1First<T = Record<string, unknown>>(
  sql: string,
  params: BindValues = []
): Promise<T | null> {
  const d1 = getD1()
  const stmt = d1.prepare(sql).bind(...params)
  return stmt.first<T>()
}

export async function d1Run(
  sql: string,
  params: BindValues = []
): Promise<void> {
  const d1 = getD1()
  const stmt = d1.prepare(sql).bind(...params)
  await stmt.run()
}

export async function d1Batch(
  queries: { sql: string; params: BindValues }[]
): Promise<void> {
  const d1 = getD1()
  const stmts = queries.map(q => d1.prepare(q.sql).bind(...q.params))
  await d1.batch(stmts)
}
