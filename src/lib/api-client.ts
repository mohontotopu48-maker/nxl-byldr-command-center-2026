/**
 * Authenticated fetch utility for client-side API calls.
 * Automatically includes Bearer token from localStorage.
 */
import { MASTER_ADMIN_EMAILS } from './constants'

interface AuthData {
  name?: string
  email?: string
  role?: string
  portalType?: string
  loggedIn?: boolean
}

function getStoredAuth(): AuthData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('vsual_auth')
    if (raw) return JSON.parse(raw)
  } catch { /* empty */ }
  return null
}

function buildBearerToken(auth: AuthData): string {
  // Base64-encode a lightweight JSON payload for the Authorization header
  const payload = btoa(JSON.stringify({
    email: auth.email || '',
    role: auth.role || 'member',
    loggedIn: true,
  }))
  return `Bearer ${payload}`
}

/**
 * Wrapper around fetch() that automatically includes auth headers.
 */
export async function apiFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const auth = getStoredAuth()

  const headers = new Headers(options.headers || {})

  // Set auth header if user is logged in
  if (auth?.loggedIn) {
    headers.set('Authorization', buildBearerToken(auth))
  }

  // Set content-type for JSON bodies if not already set
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  return fetch(url, {
    ...options,
    headers,
  })
}

/**
 * Check if the current user is a master admin.
 */
export function isMasterAdmin(): boolean {
  const auth = getStoredAuth()
  if (!auth) return false
  return (
    auth.role === 'master_admin' ||
    (auth.email ? MASTER_ADMIN_EMAILS.includes(auth.email.toLowerCase() as typeof MASTER_ADMIN_EMAILS[number]) : false)
  )
}
