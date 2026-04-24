import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRequestAuth } from '@/lib/auth-guard'
import { shouldUseMemory, memTeam } from '@/lib/in-memory-store'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const { id } = await params

    if (shouldUseMemory()) {
      const member = memTeam.findById(id)
      if (!member) {
        return NextResponse.json(
          { error: 'Team member not found' },
          { status: 404 }
        )
      }
      return NextResponse.json(member)
    }

    const member = await db.teamMember.findUnique({
      where: { id },
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
        tasks: {
          orderBy: { createdAt: 'desc' },
          include: {
            project: {
              select: { id: true, name: true },
            },
          },
        },
      },
    })

    if (!member) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(member)
  } catch (error) {
    console.error('Error fetching team member:', error)
    return NextResponse.json(
      { error: 'Failed to fetch team member' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const { id } = await params
    const body = await request.json()
    const { name, email, role, avatar, status } = body

    // Validate inputs
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        )
      }
    }

    // master_admin role can NEVER be set via the API — only via MASTER_ADMIN_EMAILS
    const safeRoles = ['admin', 'manager', 'member']
    if (role && !safeRoles.includes(role)) {
      return NextResponse.json(
        { error: `Invalid role. Must be one of: ${safeRoles.join(', ')}` },
        { status: 400 }
      )
    }

    const validStatuses = ['active', 'inactive', 'suspended']
    if (status !== undefined && !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      )
    }

    // In-memory path FIRST — before any DB calls
    if (shouldUseMemory()) {
      // Check existence
      const existing = memTeam.findById(id)
      if (!existing) {
        return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
      }
      // Check duplicate email
      if (email) {
        const dup = memTeam.findByEmail(email.trim().toLowerCase())
        if (dup && dup.id !== id) {
          return NextResponse.json({ error: 'A team member with this email already exists' }, { status: 400 })
        }
      }
      const updateData: Record<string, unknown> = {}
      if (name !== undefined) updateData.name = name.trim()
      if (email !== undefined) updateData.email = email.trim().toLowerCase()
      if (role !== undefined) updateData.role = role
      if (avatar !== undefined) updateData.avatar = avatar ?? null
      if (status !== undefined) updateData.status = status
      const member = memTeam.update(id, updateData)
      return NextResponse.json(member)
    }

    // DB path
    const existingMember = await db.teamMember.findUnique({ where: { id } })
    if (!existingMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      )
    }

    if (email) {
      const duplicateEmail = await db.teamMember.findFirst({
        where: {
          email: email.trim().toLowerCase(),
          NOT: { id },
        },
      })
      if (duplicateEmail) {
        return NextResponse.json(
          { error: 'A team member with this email already exists' },
          { status: 400 }
        )
      }
    }

    const member = await db.teamMember.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(email !== undefined && { email: email.trim().toLowerCase() }),
        ...(role !== undefined && { role }),
        ...(avatar !== undefined && { avatar: avatar ?? null }),
        ...(status !== undefined && { status }),
      },
    })

    return NextResponse.json(member)
  } catch (error) {
    console.error('Error updating team member:', error)
    return NextResponse.json(
      { error: 'Failed to update team member' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const { id } = await params

    // In-memory path FIRST — before any DB calls
    if (shouldUseMemory()) {
      const existing = memTeam.findById(id)
      if (!existing) {
        return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
      }
      memTeam.delete(id)
      return NextResponse.json({ message: 'Team member deleted successfully' })
    }

    const existingMember = await db.teamMember.findUnique({ where: { id } })
    if (!existingMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      )
    }

    await db.teamMember.delete({ where: { id } })

    return NextResponse.json({ message: 'Team member deleted successfully' })
  } catch (error) {
    console.error('Error deleting team member:', error)
    return NextResponse.json(
      { error: 'Failed to delete team member' },
      { status: 500 }
    )
  }
}
