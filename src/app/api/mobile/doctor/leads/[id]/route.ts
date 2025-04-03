import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { validateToken } from "../../../middleware";

const prisma = new PrismaClient();

// GET route handler
export async function GET(
  request: NextRequest,
  { params }: any
) {
  const id = params.id;
  
  // Validar o token de autenticação
  const validation = await validateToken(request);
  
  if (!validation.isValid || !validation.user) {
    return NextResponse.json(
      { error: validation.error || "Usuário não autenticado" },
      { status: validation.status || 401 }
    );
  }

  try {
    // Buscar lead específico
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { indication: true }
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

// PUT route handler
export async function PUT(
  request: NextRequest,
  { params }: any
) {
  const id = params.id;
  
  // Validar o token de autenticação
  const validation = await validateToken(request);
  
  if (!validation.isValid || !validation.user) {
    return NextResponse.json(
      { error: validation.error || "Usuário não autenticado" },
      { status: validation.status || 401 }
    );
  }

  try {
    // Verificar se o lead existe e pertence ao médico
    const existingLead = await prisma.lead.findUnique({
      where: { id }
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

    const data = await request.json();

    // Atualizar o lead
    const updatedLead = await prisma.lead.update({
      where: { id },
      data: {
        name: data.name || undefined,
        phone: data.phone || undefined,
        interest: data.interest !== undefined ? data.interest : undefined,
        indicationId: data.indicationId !== undefined ? data.indicationId : undefined,
        status: data.status || undefined,
        potentialValue: data.potentialValue !== undefined ? parseFloat(String(data.potentialValue)) : undefined,
        appointmentDate: data.appointmentDate !== undefined ? new Date(data.appointmentDate) : undefined,
        medicalNotes: data.medicalNotes !== undefined ? data.medicalNotes : undefined,
        utmSource: data.utmSource !== undefined ? data.utmSource : undefined,
        utmMedium: data.utmMedium !== undefined ? data.utmMedium : undefined,
        utmCampaign: data.utmCampaign !== undefined ? data.utmCampaign : undefined,
        utmTerm: data.utmTerm !== undefined ? data.utmTerm : undefined,
        utmContent: data.utmContent !== undefined ? data.utmContent : undefined
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

// DELETE route handler
export async function DELETE(
  request: NextRequest,
  { params }: any
) {
  const id = params.id;
  
  // Validar o token de autenticação
  const validation = await validateToken(request);
  
  if (!validation.isValid || !validation.user) {
    return NextResponse.json(
      { error: validation.error || "Usuário não autenticado" },
      { status: validation.status || 401 }
    );
  }

  try {
    // Verificar se o lead existe e pertence ao médico
    const lead = await prisma.lead.findUnique({
      where: { id }
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
      where: { id }
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