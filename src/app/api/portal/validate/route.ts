import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { validatePortalApiKey } from '@/lib/auth-portal'

const validateSchema = z.object({
  email: z.string().email()
})

export async function POST(request: Request) {
  try {
    // Validar chave de API
    const apiKey = request.headers.get('x-api-key')
    if (!validatePortalApiKey(apiKey)) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { email } = validateSchema.parse(body)

    const patient = await prisma.patient.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        hasPortalAccess: true,
        hasActiveProducts: true
      }
    })

    if (!patient) {
      return NextResponse.json({ exists: false }, { status: 404 })
    }

    return NextResponse.json({
      exists: true,
      hasPortalAccess: patient.hasPortalAccess,
      hasActiveProducts: patient.hasActiveProducts
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
} 