import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Forçar rota dinâmica
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const patient = await prisma.patient.findUnique({
      where: { email },
      select: { id: true, email: true, hasPortalAccess: true }
    })

    if (!patient) {
      return NextResponse.json({ exists: false }, { status: 200 })
    }

    return NextResponse.json({ 
      exists: true,
      hasAccess: patient.hasPortalAccess 
    }, { status: 200 })
  } catch (error) {
    console.error('Validate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 