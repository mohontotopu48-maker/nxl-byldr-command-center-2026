import { SignJWT, jwtVerify } from 'jose'

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('JWT_SECRET or NEXTAUTH_SECRET must be set in production')
    }
    return new TextEncoder().encode('dev-only-insecure-fallback')
  }
  return new TextEncoder().encode(secret)
}

// Lazy singleton — avoids throwing during build/static generation
let _jwtSecret: Uint8Array | null = null
function getJWTSecret(): Uint8Array {
  if (!_jwtSecret) {
    _jwtSecret = getSecret()
  }
  return _jwtSecret
}

export interface JwtPayload {
  email: string
  role: string
  loggedIn: boolean
  iat?: number
  exp?: number
}

/**
 * Sign a JWT payload. Returns the token string.
 */
export async function signToken(payload: JwtPayload): Promise<string> {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getJWTSecret())
}

/**
 * Verify and decode a JWT token. Returns the payload or null.
 */
export async function verifyToken(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getJWTSecret())
    return payload as unknown as JwtPayload
  } catch {
    return null
  }
}
