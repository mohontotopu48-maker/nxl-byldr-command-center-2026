import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRequestAuth } from '@/lib/auth-guard'
import { shouldUseMemory, memTeam } from '@/lib/in-memory-store'

export async function GET(request: NextRequest) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10) || 50))
    const skip = (page - 1) * limit

    if (shouldUseMemory()) {
      const { data, total } = memTeam.getAll(skip, limit)
      return NextResponse.json({
        data,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      })
    }

    const [total, members] = await Promise.all([
      db.teamMember.count(),
      db.teamMember.findMany({
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
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    return NextResponse.json({
      data: members,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('Error fetching team members:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team members' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

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

    // master_admin role can NEVER be set via the API — only via MASTER_ADMIN_EMAILS
    const safeRoles = ['admin', 'manager', 'member']
    if (role && !safeRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${safeRoles.join(', ')}` },
        { status: 400 }
      )
    }

    if (shouldUseMemory()) {
      try {
        const member = memTeam.create({ name, email, role, avatar, status })
        return NextResponse.json(member, { status: 201 })
      } catch (err: unknown) {
        if (err instanceof Error && err.message.includes('already exists')) {
          return NextResponse.json(
            { error: 'A team member with this email already exists' },
            { status: 400 }
          )
        }
        throw err
      }
    }

    const existingMember = await db.teamMember.findUnique({ where: { email: email.trim().toLowerCase() } })
    if (existingMember) {
      return NextResponse.json(
        { error: 'A team member with this email already exists' },
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
