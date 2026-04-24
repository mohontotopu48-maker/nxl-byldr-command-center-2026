import { NextRequest, NextResponse } from 'next/server'
import { checkRequestAuth } from '@/lib/auth-guard'

export async function GET(request: NextRequest) {
  try {
    const auth = await checkRequestAuth(request)
    if (!auth.authorized) {
      return NextResponse.json({ isAdmin: false, error: 'Not authenticated' }, { status: auth.response.status })
    }

    return NextResponse.json({
      isAdmin: auth.role === 'master_admin',
      role: auth.role,
      email: auth.email,
    })
  } catch (error) {
    console.error('Admin check error:', error)
    return NextResponse.json({ error: 'Failed to check admin status' }, { status: 500 })
  }
}
