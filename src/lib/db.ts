import { PrismaD1 } from '@prisma/adapter-d1'

// Singleton pattern for Prisma client with D1
let _db: ReturnType<typeof createDb> | undefined

function createDb(d1?: D1Database) {
  // For Cloudflare edge runtime: use D1 adapter
  if (d1) {
    const adapter = new PrismaD1(d1)
    const { PrismaClient } = require('@prisma/client')
    return new PrismaClient({ adapter })
  }

  // For local development: use standard SQLite
  const { PrismaClient } = require('@prisma/client')
  return new PrismaClient()
}

export function getDb(d1?: D1Database) {
  if (!_db) {
    _db = createDb(d1)
  }
  return _db
}

// Default export for backward compatibility
// On Cloudflare, this uses process.env.DB binding via getRequestContext
export const db = new Proxy({} as ReturnType<typeof createDb>, {
  get(_target, prop) {
    // In Cloudflare Workers/Pages, access D1 from request context
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development') {
      return getDb()[prop as keyof ReturnType<typeof createDb>]
    }

    // Lazy initialization - will be replaced by middleware with proper D1 binding
    const instance = getDb()
    return (instance as Record<string | symbol, unknown>)[prop]
  }
})
