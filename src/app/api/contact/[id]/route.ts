import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRequestAuth } from '@/lib/auth-guard'

// GET /api/contact/[id] — get a single contact message by id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const { id } = await params

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

    // Verify the message exists
    const existing = await db.contactMessage.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Contact message not found' }, { status: 404 })
    }

    // Build update payload
    const updateData: Record<string, unknown> = {}

    if (status !== undefined) {
      // Validate allowed status values
      const allowedStatuses = ['unread', 'read', 'replied']
      if (!allowedStatuses.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}` },
          { status: 400 }
        )
      }
      updateData.status = status

      // If marking as replied, auto-set repliedAt
      if (status === 'replied') {
        updateData.repliedAt = new Date()
      }
    }

    if (reply !== undefined) {
      updateData.reply = reply
      // If a reply is being written, auto-set repliedAt and status
      updateData.repliedAt = new Date()
      updateData.status = 'replied'
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

    // Verify the message exists before deleting
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
