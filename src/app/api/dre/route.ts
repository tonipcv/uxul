import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const data = await req.json();

    // Primeiro, verifica se o produto existe, se não, cria
    const product = await prisma.productInfo.upsert({
      where: { sku: data.productSku },
      update: {},
      create: { sku: data.productSku },
    });

    // Depois, verifica se o centro de custo existe, se não, cria
    const costCenter = await prisma.costCenterInfo.upsert({
      where: { code: data.costCenterCode },
      update: {},
      create: { code: data.costCenterCode },
    });

    // Finalmente, cria o registro do DRE
    const factEntry = await prisma.factEntry.create({
      data: {
        period: data.period,
        version: data.version,
        scenario: data.scenario,
        bu: data.bu,
        region: data.region,
        channel: data.channel,
        productSku: data.productSku,
        customer: data.customer,
        costCenterCode: data.costCenterCode,
        glAccount: data.glAccount,
        pnlLine: data.pnlLine,
        value: data.value,
      },
    });

    return NextResponse.json(factEntry);
  } catch (error) {
    console.error('Erro ao criar registro:', error);
    return NextResponse.json(
      { error: 'Erro ao criar registro' },
      { status: 500 }
    );
  }
} 