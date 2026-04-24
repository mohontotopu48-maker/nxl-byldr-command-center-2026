/**
 * Authenticated fetch utility for client-side API calls.
 * Automatically includes signed JWT Bearer token from localStorage.
 */
import { MASTER_ADMIN_EMAILS } from './constants'
import { signToken } from './jwt'

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

let cachedToken: string | null = null
let cachedTokenEmail: string | null = null

async function buildBearerToken(auth: AuthData): Promise<string> {
  const email = auth.email || ''
  // Return cached token if email matches and token exists
  if (cachedToken && cachedTokenEmail === email) return cachedToken
  try {
    const token = await signToken({
      email,
      role: auth.role || 'member',
      loggedIn: true,
    })
    cachedToken = token
    cachedTokenEmail = email
    return token
  } catch {
    // If JWT signing fails, the token cannot be created — return empty to trigger re-login
    cachedToken = null
    cachedTokenEmail = null
    return ''
  }
}

/**
 * Invalidate the cached JWT token. Call this on logout.
 */
export function invalidateTokenCache(): void {
  cachedToken = null
  cachedTokenEmail = null
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
    const token = await buildBearerToken(auth)
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
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

/**
 * Get the stored auth data from localStorage.
 */
export function getAuth(): AuthData | null {
  return getStoredAuth()
}
