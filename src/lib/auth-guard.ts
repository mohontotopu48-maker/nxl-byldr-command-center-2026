/**
 * Authentication guard utility for API routes.
 * Validates signed JWT tokens only — base64 fallback has been REMOVED for security.
 * Supports fallback auth for hardcoded admins and in-memory customers when DB is unavailable.
 */
import { NextResponse } from 'next/server'
import { db, isDbAvailable } from '@/lib/db'
import { isFallbackCustomer } from '@/lib/customer-store'
import { verifyToken } from '@/lib/jwt'
import { MASTER_ADMIN_EMAILS } from '@/lib/constants'

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
 * Check if the current request has a valid signed JWT token.
 * Rejects unsigned/base64 tokens. Always validates role against the database.
 *
 * Usage in API routes:
 *   const auth = await checkRequestAuth(request)
 *   if (!auth.authorized) return auth.response
 *   // auth.email, auth.role are from the DATABASE
 */
export async function checkRequestAuth(request: Request): Promise<AuthResult | UnauthorizedResult> {
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

  let email: string
  let clientRole: string

  const token = authHeader.slice(7)

  // Only accept properly signed JWT tokens (three base64url segments separated by dots)
  if (token.split('.').length === 3) {
    const payload = await verifyToken(token)
    if (!payload || !payload.email || !payload.loggedIn) {
      return {
        authorized: false,
        response: NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 }),
      }
    }
    email = payload.email.toLowerCase().trim()
    clientRole = payload.role || 'member'
  } else {
    // Base64 tokens are NO LONGER accepted — require signed JWT only
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Legacy token format no longer supported. Please log in again.' },
        { status: 401 }
      ),
    }
  }

  // Master admin bypass — always valid, no DB needed
  if (MASTER_ADMIN_EMAILS.includes(email.toLowerCase() as typeof MASTER_ADMIN_EMAILS[number])) {
    return {
      authorized: true,
      email,
      role: 'master_admin',
    }
  }

  // Customer fallback check — works when DB is not available
  if (clientRole === 'customer' && isFallbackCustomer(email)) {
    return {
      authorized: true,
      email,
      role: 'customer',
    }
  }

  // Validate email against the database
  if (!isDbAvailable()) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Authentication error: database not available' },
        { status: 503 }
      ),
    }
  }

  try {
    const user = await db.teamMember.findUnique({
      where: { email },
      select: { email: true, role: true },
    })

    if (!user) {
      // Check if it's a customer in the database
      const customer = await db.customer.findUnique({
        where: { email },
        select: { email: true },
      })
      if (!customer) {
        return {
          authorized: false,
          response: NextResponse.json({ error: 'User not found' }, { status: 401 }),
        }
      }
      return {
        authorized: true,
        email: customer.email,
        role: 'customer',
      }
    }

    // Use the DATABASE role, never trust client-provided role
    const effectiveRole = MASTER_ADMIN_EMAILS.includes(user.email.toLowerCase() as typeof MASTER_ADMIN_EMAILS[number])
      ? 'master_admin'
      : user.role

    return {
      authorized: true,
      email: user.email,
      role: effectiveRole,
    }
  } catch {
    // DB error — fail closed
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Authentication error' }, { status: 500 }),
    }
  }
}

/**
 * Check if the authenticated user is a master admin.
 */
export async function requireMasterAdmin(request: Request): Promise<AuthResult | UnauthorizedResult> {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth

  if (auth.role !== 'master_admin') {
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
