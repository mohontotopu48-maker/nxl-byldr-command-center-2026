import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

const MASTER_ADMIN_EMAILS = ['info.vsualdm@gmail.com', 'geovsualdm@gmail.com']

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ isAdmin: false, error: 'Not authenticated' }, { status: 401 })
  }

  const email = (session.user as any).email?.toLowerCase()
  const role = (session.user as any).role
  const isMasterAdmin = MASTER_ADMIN_EMAILS.includes(email) || role === 'master_admin'

  return NextResponse.json({
    isAdmin: isMasterAdmin,
    role,
    email,
  })
}
