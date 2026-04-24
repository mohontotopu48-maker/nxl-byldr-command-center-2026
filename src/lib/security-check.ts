/**
 * Runtime security checks.
 * These run once at server startup to warn about insecure configurations.
 */

export function runSecurityChecks() {
  // Check if NEXTAUTH_SECRET is properly configured
  if (!process.env.NEXTAUTH_SECRET) {
    if (process.env.NODE_ENV === 'production') {
      console.error(
        '[SECURITY] CRITICAL: NEXTAUTH_SECRET is not set. ' +
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

  // Check MASTER_ADMIN_PASSWORD_HASH
  if (!process.env.MASTER_ADMIN_PASSWORD_HASH) {
    if (process.env.NODE_ENV === 'production') {
      console.error(
        '[SECURITY] CRITICAL: MASTER_ADMIN_PASSWORD_HASH is not set. ' +
        'Master admin login will fail in production.'
      )
    } else {
      console.warn('[SECURITY] MASTER_ADMIN_PASSWORD_HASH is not set. Using development default.')
    }
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
