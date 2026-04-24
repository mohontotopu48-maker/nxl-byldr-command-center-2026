import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRequestAuth } from '@/lib/auth-guard'
import { shouldUseMemory, memContact } from '@/lib/in-memory-store'

// GET /api/contact/[id] — get a single contact message by id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const { id } = await params

    if (shouldUseMemory()) {
      const contactMessage = memContact.findById(id)
      if (!contactMessage) {
        return NextResponse.json({ error: 'Contact message not found' }, { status: 404 })
      }
      return NextResponse.json(contactMessage)
    }

    const contactMessage = await db.contactMessage.findUnique({
      where: { id },
    })

    if (!contactMessage) {
      return NextResponse.json({ error: 'Contact message not found' }, { status: 404 })
    }

    return NextResponse.json(contactMessage)
  } catch (error) {
    console.error('Contact message fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch contact message' }, { status: 500 })
  }
}

// PATCH /api/contact/[id] — reply to message or update status
// Accepts { status, reply } — admin can mark as "read"/"replied" and add reply text
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const { id } = await params
    const body = await request.json()
    const { status, reply } = body

    // Validate inputs first
    const updateData: Record<string, unknown> = {}

    if (status !== undefined) {
      const allowedStatuses = ['unread', 'read', 'replied']
      if (!allowedStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}` },
          { status: 400 }
        )
      }
      updateData.status = status

      if (status === 'replied') {
        updateData.repliedAt = new Date()
      }
    }

    if (reply !== undefined) {
      if (typeof reply !== 'string' || reply.length > 10000) {
        return NextResponse.json({ error: 'Reply must be a string under 10,000 characters' }, { status: 400 })
      }
      updateData.reply = reply
      updateData.repliedAt = new Date()
      updateData.status = 'replied'
    }

    // In-memory path FIRST — before any DB calls
    if (shouldUseMemory()) {
      const existing = memContact.findById(id)
      if (!existing) {
        return NextResponse.json({ error: 'Contact message not found' }, { status: 404 })
      }
      const contactMessage = memContact.update(id, updateData)
      return NextResponse.json(contactMessage)
    }

    // DB path
    const existing = await db.contactMessage.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Contact message not found' }, { status: 404 })
    }

    const contactMessage = await db.contactMessage.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(contactMessage)
  } catch (error) {
    console.error('Contact message update error:', error)
    return NextResponse.json({ error: 'Failed to update contact message' }, { status: 500 })
  }
}

// DELETE /api/contact/[id] — delete a contact message
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
      const existing = memContact.findById(id)
      if (!existing) {
        return NextResponse.json({ error: 'Contact message not found' }, { status: 404 })
      }
      memContact.delete(id)
      return NextResponse.json({ success: true })
    }

    const existing = await db.contactMessage.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Contact message not found' }, { status: 404 })
    }

    await db.contactMessage.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact message delete error:', error)
    return NextResponse.json({ error: 'Failed to delete contact message' }, { status: 500 })
  }
}
