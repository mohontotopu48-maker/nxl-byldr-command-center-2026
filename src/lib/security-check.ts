/**
 * Runtime security checks.
 * These run once at server startup to warn about insecure configurations.
 * They don't block the app from starting — they just log warnings.
 */

const DEFAULT_HASHES = [
  '$2b$10$U4wggkt6Poq81imvkTXlBuUjHSD9TqPYJBUi6FHLojoZwZ/7lJAsi',
]

export function runSecurityChecks() {
  // Check if NEXTAUTH_SECRET is properly configured
  if (!process.env.NEXTAUTH_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      console.error(
        '[SECURITY] CRITICAL: NEXTAUTH_SECRET is not set. Using fallback secret. ' +
        'Session tokens are NOT secure. Set NEXTAUTH_SECRET in your environment variables.'
      )
    } else {
      console.warn('[SECURITY] NEXTAUTH_SECRET is not set. Using fallback for development.')
    }
  }
  
  // Check JWT_SECRET
  if (!process.env.JWT_SECRET && !process.env.NEXTAUTH_SECRET) {
    console.warn(
      '[SECURITY] Neither JWT_SECRET nor NEXTAUTH_SECRET is set. ' +
      'Auth tokens will use a fallback secret. Not secure for production.'
    )
  }

  // Check if DATABASE_URL is configured
  if (!process.env.DATABASE_URL) {
    console.warn(
      '[SECURITY] DATABASE_URL is not set. The app will run in in-memory fallback mode. ' +
      'All data will be lost on server restart. Set DATABASE_URL for persistent storage.'
    )
  }

  console.log('[SECURITY] Runtime security checks complete.')
}
