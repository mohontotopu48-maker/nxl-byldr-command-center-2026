import { NextRequest, NextResponse } from 'next/server'
import { db, isDbAvailable } from '@/lib/db'
import { hash } from 'bcryptjs'
import { getInMemoryOtp, deleteInMemoryOtp, getFallbackCustomer } from '@/lib/customer-store'

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
    const passwordHash = await hash(newPassword, 10)

    // ═══ IN-MEMORY FALLBACK (when DATABASE_URL is not configured) ═══
    if (!isDbAvailable()) {
      const memOtp = getInMemoryOtp(normalizedEmail)
      if (!memOtp || !memOtp.verified) {
        return NextResponse.json(
          { error: 'OTP not verified. Please verify your OTP first.' },
          { status: 400 }
        )
      }

      // Check in-memory customers
      const memCustomer = getFallbackCustomer(normalizedEmail)
      if (memCustomer) {
        memCustomer.passwordHash = passwordHash
        deleteInMemoryOtp(normalizedEmail)
        return NextResponse.json({
          success: true,
          message: 'Password reset successfully. You can now sign in with your new password.',
        })
      }

      return NextResponse.json(
        { error: 'No account found with this email address' },
        { status: 404 }
      )
    }

    // ═══ DATABASE PATH ═══
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

    // Find the TeamMember or Customer and update their password
    const member = await db.teamMember.findUnique({ where: { email: normalizedEmail } })
    if (member) {
      await db.teamMember.update({ where: { email: normalizedEmail }, data: { password: passwordHash } })
      await db.otpCode.deleteMany({ where: { email: normalizedEmail } })
      return NextResponse.json({
        success: true,
        message: 'Password reset successfully. You can now sign in with your new password.',
      })
    }

    const customer = await db.customer.findUnique({ where: { email: normalizedEmail } })
    if (customer) {
      await db.customer.update({ where: { email: normalizedEmail }, data: { password: passwordHash } })
      await db.otpCode.deleteMany({ where: { email: normalizedEmail } })
      return NextResponse.json({
        success: true,
        message: 'Password reset successfully. You can now sign in with your new password.',
      })
    }

    return NextResponse.json(
      { error: 'No account found with this email address' },
      { status: 404 }
    )
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}
