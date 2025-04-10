import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { validateToken } from "../../middleware";
import { getToken } from "next-auth/jwt";
import { headers } from "next/headers";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  // Validar o token de autenticação
  const validation = await validateToken(req);
  
  if (!validation.isValid || !validation.user) {
    return NextResponse.json(
      { error: validation.error || "Usuário não autenticado" },
      { status: validation.status || 401 }
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
  const token = await getToken({ req });
  
  if (!token?.sub) {
    return NextResponse.json(
      { error: "Usuário não autenticado" },
      { status: 401 }
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

    // Check for existing lead with same phone number for this user
    const existingLead = await prisma.lead.findFirst({
      where: {
        phone,
        userId: token.sub
      }
    });

    const headersList = headers();
    const userAgent = headersList.get("user-agent") || "Unknown";
    const ip = (headersList.get("x-forwarded-for") || "Unknown").split(",")[0];

    let lead;
    const eventType = existingLead ? 'lead_update' : 'lead_create';

    if (existingLead) {
      // Update existing lead
      lead = await prisma.lead.update({
        where: { id: existingLead.id },
        data: {
          name,
          interest: interest || null,
          indicationId: indicationId || null,
          status: status || existingLead.status,
          potentialValue: potentialValue ? parseFloat(potentialValue) : null,
          appointmentDate: appointmentDate ? new Date(appointmentDate) : null,
          medicalNotes: medicalNotes || null,
          utmSource: utmSource || existingLead.utmSource,
          utmMedium: utmMedium || existingLead.utmMedium,
          utmCampaign: utmCampaign || existingLead.utmCampaign,
          utmTerm: utmTerm || existingLead.utmTerm,
          utmContent: utmContent || existingLead.utmContent
        }
      });
    } else {
      // Create new lead
      lead = await prisma.lead.create({
        data: {
          name,
          phone,
          interest: interest || null,
          userId: token.sub,
          indicationId: indicationId || null,
          status: status || "Novo",
          potentialValue: potentialValue ? parseFloat(potentialValue) : null,
          appointmentDate: appointmentDate ? new Date(appointmentDate) : null,
          medicalNotes: medicalNotes || null,
          utmSource: utmSource || null,
          utmMedium: utmMedium || null,
          utmCampaign: utmCampaign || null,
          utmTerm: utmTerm || null,
          utmContent: utmContent || null
        }
      });
    }

    // Log the event with proper fields
    await prisma.event.create({
      data: {
        type: eventType,
        userId: token.sub,
        indicationId: indicationId || null,
        ip,
        userAgent,
        utmSource: utmSource || null,
        utmMedium: utmMedium || null,
        utmCampaign: utmCampaign || null,
        utmTerm: utmTerm || null,
        utmContent: utmContent || null
      }
    });

    return NextResponse.json(lead, {
      status: existingLead ? 200 : 201
    });
  } catch (error) {
    console.error("Erro ao processar lead:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
}
