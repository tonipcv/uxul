import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verify, sign } from 'jsonwebtoken'
import { cookies } from 'next/headers'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-jwt-secret'

// Forçar rota dinâmica
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Token é obrigatório' }, { status: 400 })
    }

    // Verificar o token
    const decoded = verify(token, JWT_SECRET) as {
      patientId: string
      email: string
      type: string
    }

    if (decoded.type !== 'magic-link') {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
    }

    // Buscar paciente
    const patient = await prisma.patient.findUnique({
      where: { 
        id: decoded.patientId,
        email: decoded.email,
        accessToken: token,
        accessTokenExpiry: {
          gt: new Date()
        }
      }
    })

    if (!patient) {
      return NextResponse.json({ error: 'Token inválido ou expirado' }, { status: 401 })
    }

    // Criar cookie de sessão
    const sessionToken = sign(
      { 
        patientId: patient.id,
        email: patient.email,
        type: 'session'
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    // Configurar cookie
    cookies().set('patient_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 dias
      path: '/'
    })

    return NextResponse.json({ 
      success: true,
      message: 'Autenticação realizada com sucesso',
      redirectUrl: '/patient/dashboard'
    })

  } catch (error) {
    console.error('Erro ao verificar token:', error)
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
  }
} 