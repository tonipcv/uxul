import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/outbound/[id]/clinics
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const outboundId = params.id;

    // Verificar se o contato existe e pertence ao usuário
    const existingOutbound = await prisma.outbound.findUnique({
      where: { 
        id: outboundId,
        userId: session.user.id
      },
    });

    if (!existingOutbound) {
      return NextResponse.json({ error: "Contato não encontrado" }, { status: 404 });
    }

    // Buscar as clínicas associadas a este contato
    const outboundClinics = await prisma.outboundClinic.findMany({
      where: { outboundId: outboundId },
      include: { clinic: true },
    });

    // Transformar o resultado para retornar apenas as clínicas
    const clinics = outboundClinics.map(rel => rel.clinic);

    return NextResponse.json(clinics);
  } catch (error) {
    console.error("Erro ao buscar clínicas do contato:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
} 