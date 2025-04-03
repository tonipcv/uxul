import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { validateToken } from "../../../middleware";

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Validar o token de autenticação
  const validation = await validateToken(req);
  
  if (!validation.isValid) {
    return NextResponse.json(
      { error: validation.error },
      { status: validation.status }
    );
  }

  try {
    // Buscar lead específico
    const lead = await prisma.lead.findUnique({
      where: {
        id: params.id
      },
      include: {
        indication: true
      }
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Lead não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o lead pertence ao médico autenticado
    if (lead.userId !== validation.user.id) {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }

    return NextResponse.json(lead);
  } catch (error) {
    console.error("Erro ao buscar lead:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Validar o token de autenticação
  const validation = await validateToken(req);
  
  if (!validation.isValid) {
    return NextResponse.json(
      { error: validation.error },
      { status: validation.status }
    );
  }

  try {
    // Verificar se o lead existe e pertence ao médico
    const existingLead = await prisma.lead.findUnique({
      where: {
        id: params.id
      }
    });

    if (!existingLead) {
      return NextResponse.json(
        { error: "Lead não encontrado" },
        { status: 404 }
      );
    }

    if (existingLead.userId !== validation.user.id) {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }

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

    // Atualizar o lead
    const updatedLead = await prisma.lead.update({
      where: {
        id: params.id
      },
      data: {
        name: name || undefined,
        phone: phone || undefined,
        interest: interest !== undefined ? interest : undefined,
        indicationId: indicationId !== undefined ? indicationId : undefined,
        status: status || undefined,
        potentialValue: potentialValue !== undefined ? parseFloat(String(potentialValue)) : undefined,
        appointmentDate: appointmentDate !== undefined ? new Date(appointmentDate) : undefined,
        medicalNotes: medicalNotes !== undefined ? medicalNotes : undefined,
        utmSource: utmSource !== undefined ? utmSource : undefined,
        utmMedium: utmMedium !== undefined ? utmMedium : undefined,
        utmCampaign: utmCampaign !== undefined ? utmCampaign : undefined,
        utmTerm: utmTerm !== undefined ? utmTerm : undefined,
        utmContent: utmContent !== undefined ? utmContent : undefined
      },
      include: {
        indication: true
      }
    });

    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error("Erro ao atualizar lead:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Validar o token de autenticação
  const validation = await validateToken(req);
  
  if (!validation.isValid) {
    return NextResponse.json(
      { error: validation.error },
      { status: validation.status }
    );
  }

  try {
    // Verificar se o lead existe e pertence ao médico
    const lead = await prisma.lead.findUnique({
      where: {
        id: params.id
      }
    });

    if (!lead) {
      return NextResponse.json(
        { error: "Lead não encontrado" },
        { status: 404 }
      );
    }

    if (lead.userId !== validation.user.id) {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      );
    }

    // Excluir o lead
    await prisma.lead.delete({
      where: {
        id: params.id
      }
    });

    return NextResponse.json(
      { message: "Lead excluído com sucesso" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao excluir lead:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
}
