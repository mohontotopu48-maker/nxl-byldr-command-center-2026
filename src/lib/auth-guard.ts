/**
 * Authentication guard utility for API routes.
 * Use at the top of every protected API route handler.
 */
import { NextResponse } from 'next/server'

export interface AuthResult {
  authorized: true
  email: string
  role: string
}

export interface UnauthorizedResult {
  authorized: false
  response: NextResponse
}

/**
 * Check if the current request has a valid auth token in the Authorization header.
 * This works with the custom auth flow that uses localStorage + Bearer tokens.
 *
 * Usage in API routes:
 *   const auth = checkRequestAuth(request)
 *   if (!auth.authorized) return auth.response
 *   // auth.email, auth.role are available
 */
export function checkRequestAuth(request: Request): AuthResult | UnauthorizedResult {
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ),
    }
  }

  try {
    // The client sends a JSON-encoded auth object as the Bearer token
    const token = authHeader.slice(7) // Remove "Bearer " prefix
    const payload = JSON.parse(atob(token))

    if (!payload.email || !payload.loggedIn) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Invalid token' },
          { status: 401 }
        ),
      }
    }

    return {
      authorized: true,
      email: payload.email.toLowerCase(),
      role: payload.role || 'member',
    }
  } catch {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      ),
    }
  }
}

/**
 * Check if the authenticated user is a master admin.
 * Returns the auth result if admin, or an unauthorized response if not.
 */
export function requireMasterAdmin(request: Request): AuthResult | UnauthorizedResult {
  const auth = checkRequestAuth(request)
  if (!auth.authorized) return auth

  // Master admin emails are checked server-side
  const MASTER_ADMIN_EMAILS = [
    'info.vsualdm@gmail.com',
    'geovsualdm@gmail.com',
  ]

  const isMasterAdmin =
    auth.role === 'master_admin' ||
    MASTER_ADMIN_EMAILS.includes(auth.email)

  if (!isMasterAdmin) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Master admin access required' },
        { status: 403 }
      ),
    }
  }

  return auth
}
