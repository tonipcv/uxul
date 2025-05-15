import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";
import crypto from "crypto";

const clinicSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(1, "Nome da clínica é obrigatório"),
  localizacao: z.string().optional().nullable(),
  mediaDeMedicos: z.number().optional().nullable(),
  instagram: z.string().optional().nullable(),
  site: z.string().optional().nullable(),
  linkBio: z.string().optional().nullable(),
  contato: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
});

const outboundUpdateSchema = z.object({
  nome: z.string().optional(),
  especialidade: z.string().optional().nullable(),
  instagram: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  status: z.string().optional().nullable(),
  observacoes: z.string().optional().nullable(),
  endereco: z.string().optional().nullable(),
  clinics: z.array(clinicSchema).optional(),
});

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

    // Buscar o contato com clínicas associadas
    const outbound = await prisma.outbound.findUnique({
      where: {
        id: outboundId,
        userId: session.user.id  // Verificar se pertence ao usuário
      },
      include: {
        clinics: {
          include: {
            clinic: true,
          },
        },
      },
    });

    if (!outbound) {
      return NextResponse.json({ error: "Contato não encontrado" }, { status: 404 });
    }

    // Transformar o resultado para um formato mais amigável
    const result = {
      ...outbound,
      clinics: outbound.clinics.map(rel => rel.clinic),
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro ao buscar contato de outbound:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const body = await request.json();
    
    // Validar os dados
    const validatedData = outboundUpdateSchema.safeParse(body);
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: validatedData.error.format() },
        { status: 400 }
      );
    }

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

    // Extrair clínicas para processar separadamente
    const { clinics, ...outboundData } = validatedData.data;

    // Atualizar o contato
    const updatedOutbound = await prisma.outbound.update({
      where: { id: outboundId },
      data: outboundData,
    });

    // Se houver clínicas para atualizar
    if (clinics && clinics.length > 0) {
      // Primeiro remover todas as associações existentes
      await prisma.outboundClinic.deleteMany({
        where: { outboundId: outboundId },
      });

      // Depois criar novas associações
      for (const clinicData of clinics) {
        let clinicId;

        if (clinicData.id) {
          // Atualizar clínica existente
          await prisma.clinic.update({
            where: { id: clinicData.id },
            data: clinicData,
          });
          clinicId = clinicData.id;
        } else {
          // Criar nova clínica
          const newClinic = await prisma.clinic.create({
            data: clinicData,
          });
          clinicId = newClinic.id;
        }

        // Associar a clínica ao contato
        await prisma.outboundClinic.create({
          data: {
            outboundId: updatedOutbound.id,
            clinicId: clinicId,
          },
        });
      }
    }

    // Buscar o contato atualizado com clínicas para retornar
    const outboundWithClinics = await prisma.outbound.findUnique({
      where: { id: updatedOutbound.id },
      include: {
        clinics: {
          include: {
            clinic: true,
          },
        },
      },
    });

    // Transformar o resultado
    const result = {
      ...outboundWithClinics,
      clinics: outboundWithClinics?.clinics.map(rel => rel.clinic) || [],
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro ao atualizar contato de outbound:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    // Primeiro remover todas as associações com clínicas
    await prisma.outboundClinic.deleteMany({
      where: { outboundId: outboundId },
    });

    // Depois remover o contato
    await prisma.outbound.delete({
      where: { id: outboundId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao excluir contato de outbound:", error);
    return NextResponse.json(
      { error: "Erro ao processar a solicitação" },
      { status: 500 }
    );
  }
} 