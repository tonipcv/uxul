import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const data = await request.json();

    // Validar o valor se for numérico
    if (data.value !== undefined) {
      const numericValue = parseFloat(data.value);
      if (isNaN(numericValue)) {
        return NextResponse.json(
          { error: 'Valor inválido' },
          { status: 400 }
        );
      }
      data.value = numericValue;
    }

    const updatedEntry = await prisma.factEntry.update({
      where: { id },
      data,
      include: {
        product: true,
        costCenter: true,
      },
    });

    return NextResponse.json(updatedEntry);
  } catch (error) {
    console.error('Erro ao atualizar registro:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar registro' },
      { status: 500 }
    );
  }
} 