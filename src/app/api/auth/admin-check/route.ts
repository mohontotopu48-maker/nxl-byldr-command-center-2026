import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { MASTER_ADMIN_EMAILS } from '@/lib/constants'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ isAdmin: false, error: 'Not authenticated' }, { status: 401 })
    }

    const email = (session.user as any).email?.toLowerCase()
    const role = (session.user as any).role
    const isMasterAdmin = MASTER_ADMIN_EMAILS.includes(email as typeof MASTER_ADMIN_EMAILS[number]) || role === 'master_admin'

    return NextResponse.json({
      isAdmin: isMasterAdmin,
      role,
      email,
    })
  } catch (error) {
    console.error('Admin check error:', error)
    return NextResponse.json({ error: 'Failed to check admin status' }, { status: 500 })
  }
}
