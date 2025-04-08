import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, email, phone, leadId } = await req.json();

    // Validar campos obrigatórios
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Nome, email e telefone são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar se já existe um paciente com este email
    const existingPatient = await prisma.patient.findFirst({
      where: {
        email,
        userId: session.user.id
      }
    });

    if (existingPatient) {
      return NextResponse.json(
        { error: 'Já existe um paciente cadastrado com este email' },
        { status: 400 }
      );
    }

    // Criar o paciente
    const patient = await prisma.patient.create({
      data: {
        name,
        email,
        phone,
        userId: session.user.id,
        leadId: leadId || null
      }
    });

    return NextResponse.json(patient);
  } catch (error) {
    console.error('Error creating patient:', error);
    return NextResponse.json(
      { error: 'Erro ao criar paciente' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const patients = await prisma.patient.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        lead: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(patients);
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar pacientes' },
      { status: 500 }
    );
  }
} 