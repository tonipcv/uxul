import { getServerSession } from 'next-auth/next'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const patient = await prisma.patient.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        hasActiveProducts: true,
        hasPortalAccess: true,
        user: {
          select: {
            id: true,
            name: true,
            specialty: true,
            image: true
          }
        }
      }
    })

    if (!patient) {
      return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 })
    }

    return NextResponse.json({
      id: patient.id,
      name: patient.name,
      email: patient.email,
      phone: patient.phone,
      hasActiveProducts: patient.hasActiveProducts,
      hasPortalAccess: patient.hasPortalAccess,
      doctor: patient.user ? {
        id: patient.user.id,
        name: patient.user.name,
        specialty: patient.user.specialty,
        image: patient.user.image
      } : null
    })
  } catch (error) {
    console.error('Erro ao buscar perfil do paciente:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const patient = await prisma.patient.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        hasPortalAccess: true,
        hasActiveProducts: true,
        createdAt: true
      }
    })

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    return NextResponse.json(patient)
  } catch (error) {
    console.error('Profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 