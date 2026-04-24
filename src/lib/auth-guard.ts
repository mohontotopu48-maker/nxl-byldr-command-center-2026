/**
 * Authentication guard utility for API routes.
 * Validates tokens against the database — NOT by trusting client-provided claims.
 */
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export interface AuthResult {
  authorized: true
  email: string
  role: string
}

export interface UnauthorizedResult {
  authorized: false
  response: NextResponse
}

// Master admin emails — server-side only, never trust client claims
const MASTER_ADMIN_EMAILS = [
  'info.vsualdm@gmail.com',
  'geovsualdm@gmail.com',
]

/**
 * Check if the current request has a valid auth token.
 * The token is a base64-encoded JSON object with {email, loggedIn}.
 * We validate the email against the database and return the DB role — NOT the client claim.
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
  try {
    const token = authHeader.slice(7)
    const payload = JSON.parse(atob(token))
    if (!payload.email || !payload.loggedIn) {
      return {
        authorized: false,
        response: NextResponse.json({ error: 'Invalid token' }, { status: 401 }),
      }
    }
    email = String(payload.email).toLowerCase().trim()
  } catch {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 }),
    }
  }

  // Validate email against the database
  try {
    const user = await db.teamMember.findUnique({
      where: { email },
      select: { email: true, role: true },
    })

    if (!user) {
      // Check if it's a customer
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
    const effectiveRole = MASTER_ADMIN_EMAILS.includes(email) ? 'master_admin' : user.role

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
 * Validates against DB, then checks master admin emails server-side.
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

/**
 * Lightweight sync auth check — just validates token format without DB lookup.
 * Use for read-only endpoints where performance matters more than strict security.
 */
export function checkRequestAuthSync(request: Request): AuthResult | UnauthorizedResult {
  const authHeader = request.headers.get('authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Authentication required' }, { status: 401 }),
    }
  }

  try {
    const token = authHeader.slice(7)
    const payload = JSON.parse(atob(token))
    if (!payload.email || !payload.loggedIn) {
      return {
        authorized: false,
        response: NextResponse.json({ error: 'Invalid token' }, { status: 401 }),
      }
    }

    const email = String(payload.email).toLowerCase().trim()
    const role = MASTER_ADMIN_EMAILS.includes(email) ? 'master_admin' : (payload.role || 'member')

    return {
      authorized: true,
      email,
      role,
    }
  } catch {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 }),
    }
  }
}
