import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    if (!otp || typeof otp !== 'string') {
      return NextResponse.json(
        { error: 'OTP is required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    const stored = await db.otpCode.findFirst({
      where: { email: normalizedEmail },
      orderBy: { createdAt: 'desc' },
    })

    if (!stored) {
      return NextResponse.json(
        { error: 'No OTP found. Please request a new one.' },
        { status: 400 }
      )
    }

    if (new Date() > stored.expiresAt) {
      await db.otpCode.deleteMany({ where: { email: normalizedEmail } })
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    const trimmedOtp = otp.trim()
    const isMatch = stored.code.length === trimmedOtp.length &&
      timingSafeEqual(Buffer.from(stored.code), Buffer.from(trimmedOtp))

    if (!isMatch) {
      return NextResponse.json(
        { error: 'Invalid OTP. Please try again.' },
        { status: 400 }
      )
    }

    // Mark as verified
    await db.otpCode.update({
      where: { id: stored.id },
      data: { verified: true },
    })

    return NextResponse.json({
      success: true,
      message: 'OTP verified successfully',
    })
  } catch (error) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: 'Failed to verify OTP' },
      { status: 500 }
    )
  }
}
