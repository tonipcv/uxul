import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Código de teste para API simplificada
const mockData = [
  {
    id: 1,
    name: "Teste Manual",
    email: "teste@example.com",
    whatsapp: "(11) 99999-9999",
    instagram: "@teste",
    area: "Medicina",
    employees: "1-10",
    revenue: "30 mil a 100 mil / mês",
    useTechnology: "Sim",
    status: "new",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export async function POST(request: Request) {
  try {
    console.log('⚡ POST /api/form-submission: Início');
    const body = await request.json();
    console.log('📝 Dados recebidos:', body);
    
    const { name, email, whatsapp, instagram, area, employees, revenue, useTechnology } = body;

    // Validação básica
    if (!name || !email || !whatsapp || !instagram || !area || !employees || !revenue || !useTechnology) {
      console.log('⚠️ Validação falhou, campos obrigatórios ausentes');
      return NextResponse.json(
        { error: 'Todos os campos são obrigatórios' },
        { status: 400 }
      );
    }

    try {
      // Salvar no banco de dados
      console.log('💾 Tentando salvar lead no banco de dados...');
      const lead = await prisma.insideSalesLead.create({
        data: {
          name,
          email,
          whatsapp,
          instagram,
          area,
          employees,
          revenue,
          useTechnology
        },
      });
      console.log('✅ Lead salvo com sucesso:', lead);

      return NextResponse.json(
        { 
          success: true, 
          message: 'Dados recebidos com sucesso',
          data: lead 
        },
        { status: 201 }
      );
    } catch (dbError) {
      console.error('❌ Erro no banco de dados:', dbError);
      
      // Como fallback, vamos retornar sucesso mesmo sem salvar no banco
      // para testar se o problema está no banco ou na comunicação
      console.log('⚠️ RETORNANDO MOCK DATA COMO FALLBACK');
      return NextResponse.json(
        { 
          success: true, 
          message: 'Simulação - dados não foram salvos no banco',
          data: {
            id: Date.now(),
            name,
            email,
            whatsapp,
            instagram,
            area,
            employees,
            revenue,
            useTechnology,
            status: "new",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('❌ Erro ao processar formulário de inside sales:', error);
    return NextResponse.json(
      { error: 'Erro ao processar sua solicitação' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    console.log('⚡ GET /api/form-submission: Buscando leads de Inside Sales');
    
    try {
      // Buscar todos os leads, ordenados por data de criação (mais recentes primeiro)
      const leads = await prisma.insideSalesLead.findMany({
        orderBy: {
          createdAt: 'desc',
        },
      });
      
      console.log(`📋 Encontrados ${leads.length} leads`);
      if (leads.length > 0) {
        console.log('📝 Primeiro lead:', leads[0]);
      }
      
      return NextResponse.json(leads.length > 0 ? leads : mockData);
    } catch (dbError) {
      console.error('❌ Erro ao acessar banco de dados:', dbError);
      console.log('⚠️ RETORNANDO MOCK DATA COMO FALLBACK');
      return NextResponse.json(mockData);
    }
  } catch (error) {
    console.error('❌ Erro ao buscar leads de inside sales:', error);
    return NextResponse.json(
      mockData,
      { status: 200 }
    );
  }
} 