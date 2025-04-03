import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { validateToken } from "../../middleware";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  // Validar o token de autenticação
  const validation = await validateToken(req);
  
  if (!validation.isValid) {
    return NextResponse.json(
      { error: validation.error },
      { status: validation.status }
    );
  }

  try {
    // Extrair parâmetros de consulta
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    // Construir filtros
    const filters: any = {
      userId: validation.user.id
    };

    if (status) {
      filters.status = status;
    }

    // Buscar leads do médico
    const leads = await prisma.lead.findMany({
      where: filters,
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit,
      include: {
        indication: true
      }
    });

    // Contar o total para paginação
    const total = await prisma.lead.count({
      where: filters
    });

    return NextResponse.json({
      data: leads,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Erro ao buscar leads:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Validar o token de autenticação
  const validation = await validateToken(req);
  
  if (!validation.isValid) {
    return NextResponse.json(
      { error: validation.error },
      { status: validation.status }
    );
  }

  try {
    const {
      name,
      phone,
      interest,
      indicationId,
      status,
      potentialValue,
      appointmentDate,
      medicalNotes,
      utmSource,
      utmMedium,
      utmCampaign,
      utmTerm,
      utmContent
    } = await req.json();

    // Validar campos obrigatórios
    if (!name || !phone) {
      return NextResponse.json(
        { error: "Nome e telefone são obrigatórios" },
        { status: 400 }
      );
    }

    // Criar o novo lead
    const newLead = await prisma.lead.create({
      data: {
        name,
        phone,
        interest: interest || null,
        userId: validation.user.id,
        indicationId: indicationId || null,
        status: status || 'Novo',
        potentialValue: potentialValue ? parseFloat(potentialValue) : null,
        appointmentDate: appointmentDate ? new Date(appointmentDate) : null,
        medicalNotes: medicalNotes || null,
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
        utmTerm: utmTerm || null,
        utmContent: utmContent || null
      },
      include: {
        indication: true
      }
    });

    return NextResponse.json(newLead, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar lead:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
}
