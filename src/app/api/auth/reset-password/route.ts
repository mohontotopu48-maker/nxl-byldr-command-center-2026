import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword } = await request.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    const stored = await db.otpCode.findFirst({
      where: { email: normalizedEmail },
      orderBy: { createdAt: 'desc' },
    })

    if (!stored || !stored.verified) {
      return NextResponse.json(
        { error: 'OTP not verified. Please verify your OTP first.' },
        { status: 400 }
      )
    }

    // Find the TeamMember and update their password
    const member = await db.teamMember.findUnique({ where: { email: normalizedEmail } })
    if (!member) {
      return NextResponse.json(
        { error: 'No account found with this email address' },
        { status: 404 }
      )
    }

    await db.teamMember.update({
      where: { email: normalizedEmail },
      data: { password: newPassword },
    })

    console.log(`[Password Reset] Password updated for ${normalizedEmail}`)

    // Clean up OTP
    await db.otpCode.deleteMany({ where: { email: normalizedEmail } })

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now sign in with your new password.',
    })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}
