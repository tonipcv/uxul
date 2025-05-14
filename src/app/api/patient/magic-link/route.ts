import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { sign } from 'jsonwebtoken'
import { sendPatientConfirmationEmail } from '@/lib/email'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-jwt-secret'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email é obrigatório' }, { status: 400 })
    }

    const patient = await prisma.patient.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        hasPortalAccess: true,
        user: {
          select: {
            name: true
          }
        }
      }
    })

    if (!patient) {
      return NextResponse.json({ error: 'Paciente não encontrado' }, { status: 404 })
    }

    if (!patient.hasPortalAccess) {
      return NextResponse.json({ error: 'Acesso ao portal não liberado' }, { status: 403 })
    }

    // Gerar token JWT com expiração de 15 minutos
    const token = sign(
      { 
        patientId: patient.id,
        email: patient.email,
        type: 'magic-link'
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    )

    // Atualizar o token de acesso no banco
    await prisma.patient.update({
      where: { id: patient.id },
      data: {
        accessToken: token,
        accessTokenExpiry: new Date(Date.now() + 15 * 60 * 1000) // 15 minutos
      }
    })

    // Gerar link de acesso
    const accessLink = `${process.env.NEXT_PUBLIC_APP_URL}/patient/access/verify?token=${token}`

    // Enviar email com o magic link
    await sendPatientConfirmationEmail({
      to: patient.email,
      patientName: patient.name,
      doctorName: patient.user?.name || 'Médico',
      accessLink
    })

    return NextResponse.json({ 
      success: true,
      message: 'Link de acesso enviado com sucesso'
    })

  } catch (error) {
    console.error('Erro ao gerar magic link:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 