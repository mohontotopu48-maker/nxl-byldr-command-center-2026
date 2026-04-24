import { NextRequest, NextResponse } from 'next/server'
import { randomInt } from 'crypto'
import { db, isDbAvailable } from '@/lib/db'
import { storeInMemoryOtp } from '@/lib/customer-store'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

function generateOTP(): string {
  return randomInt(100000, 1000000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request)
    const rl = rateLimit(`forgot-password:${ip}`, { limit: 3, windowMs: 60000 })
    if (!rl.success) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil((rl.resetAt - Date.now()) / 1000)) }
      })
    }

    const { email } = await request.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()
    const otp = generateOTP()

    // ═══ DATABASE PATH (when DATABASE_URL is configured) ═══
    if (isDbAvailable()) {
      try {
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

        // Delete any existing OTP for this email
        await db.otpCode.deleteMany({ where: { email: normalizedEmail } })

        // Clean up expired OTPs older than 1 hour (prevent unbounded growth)
        await db.otpCode.deleteMany({
          where: { expiresAt: { lt: new Date(Date.now() - 60 * 60 * 1000) } },
        })

        // Store new OTP in database
        await db.otpCode.create({
          data: {
            email: normalizedEmail,
            code: otp,
            expiresAt,
          },
        })

        // OTP is only logged server-side for development debugging
        if (process.env.NODE_ENV === 'development') {
          console.log(`[OTP-DEV] Password reset OTP for ${normalizedEmail}: ${otp}`)
        }

        return NextResponse.json({
          success: true,
          message: 'OTP sent to your email address',
        })
      } catch (dbError) {
        console.error('DB OTP storage failed, falling back to in-memory:', dbError)
        // Fall through to in-memory fallback
      }
    }

    // ═══ IN-MEMORY FALLBACK (when DATABASE_URL is not configured) ═══
    storeInMemoryOtp(normalizedEmail, otp)

    if (process.env.NODE_ENV === 'development') {
      console.log(`[OTP-DEV] Password reset OTP for ${normalizedEmail}: ${otp}`)
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your email address',
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    )
  }
}
