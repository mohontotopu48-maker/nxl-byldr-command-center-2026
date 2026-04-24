import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const members = await db.teamMember.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        status: true,
        phone: true,
        location: true,
        bio: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(members)
  } catch (error) {
    console.error('Error fetching team members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, role, avatar, status } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Team member name is required' },
        { status: 400 }
      )
    }

    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    const existingMember = await db.teamMember.findUnique({ where: { email: email.trim().toLowerCase() } })
    if (existingMember) {
      return NextResponse.json(
        { error: 'A team member with this email already exists' },
        { status: 400 }
      )
    }

    // master_admin role can NEVER be set via the API — only via MASTER_ADMIN_EMAILS
    const safeRoles = ['admin', 'manager', 'member']
    if (role && !safeRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${safeRoles.join(', ')}` },
        { status: 400 }
      )
    }

    const member = await db.teamMember.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        role: role ?? 'member',
        avatar: avatar ?? null,
        status: status ?? 'active',
      },
      select: {
        id: true, name: true, email: true, role: true, avatar: true, status: true,
        phone: true, location: true, bio: true, createdAt: true, updatedAt: true,
      },
    })

    return NextResponse.json(member, { status: 201 })
  } catch (error) {
    console.error('Error creating team member:', error)
    return NextResponse.json(
      { error: 'Failed to create team member' },
      { status: 500 }
    )
  }
}
