import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { checkRequestAuth } from '@/lib/auth-guard'

export async function GET(request: Request) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const leads = await db.mpzLead.findMany({
      include: {
        tasks: true,
        activities: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(leads)
  } catch (error) {
    console.error('GET /api/mpz/leads error:', error)
    return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const auth = await checkRequestAuth(request)
  if (!auth.authorized) return auth.response

  try {
    const body = await request.json()
    const { name, businessName, phone, email, serviceType } = body

    if (!name || !businessName || !serviceType) {
      return NextResponse.json(
        { error: 'Missing required fields: name, businessName, serviceType' },
        { status: 400 }
      )
    }

    const lead = await db.mpzLead.create({
      data: {
        name,
        businessName,
        phone: phone ?? '',
        email: email ?? '',
        serviceType,
        stage: 'new_lead',
        assignedTo: 'Sal',
        tags: 'CA_BYLDR_LEAD',
      },
      include: { tasks: true, activities: true },
    })

    return NextResponse.json(lead, { status: 201 })
  } catch (error) {
    console.error('POST /api/mpz/leads error:', error)
    return NextResponse.json({ error: 'Failed to create lead' }, { status: 500 })
  }
}
