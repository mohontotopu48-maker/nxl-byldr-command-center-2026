import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()
    const otp = generateOTP()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Delete any existing OTP for this email
    await db.otpCode.deleteMany({ where: { email: normalizedEmail } })

    // Store new OTP in database
    await db.otpCode.create({
      data: {
        email: normalizedEmail,
        code: otp,
        expiresAt,
      },
    })

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[OTP] Password reset OTP for ${normalizedEmail}: ${otp}`)
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent to your email address',
      ...(process.env.NODE_ENV !== 'production' && { otp }),
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Failed to send OTP' },
      { status: 500 }
    )
  }
}
