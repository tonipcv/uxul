import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

// Schema para validação dos dados
const leadFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido"),
  whatsapp: z.string().min(1, "WhatsApp é obrigatório"),
  instagram: z.string().optional(),
  area: z.string().min(1, "Área é obrigatória"),
  employees: z.string().min(1, "Número de funcionários é obrigatório"),
  revenue: z.string().min(1, "Faturamento é obrigatório"),
  useTechnology: z.string().min(1, "Uso de tecnologia é obrigatório"),
});

export async function POST(request: Request) {
  try {
    console.log('[API] POST /api/leadform: Iniciando');
    
    const body = await request.json();
    console.log('[API] POST /api/leadform: Dados recebidos:', body);
    
    // Validar dados recebidos
    const validationResult = leadFormSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.log('[API] POST /api/leadform: Validação falhou', validationResult.error);
      return NextResponse.json(
        { error: "Dados inválidos", details: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    console.log('[API] POST /api/leadform: Validação bem-sucedida, tentando salvar no banco');
    
    // Verificar se o modelo LeadForm está disponível no objeto db
    const dbKeys = Object.keys(db);
    console.log('[API] Propriedades disponíveis em db:', dbKeys);
    
    let result;
    
    // Tentar usar SQL direto se o modelo não estiver disponível
    if (!dbKeys.includes('leadForm')) {
      console.log('[API] Modelo LeadForm não encontrado, usando SQL direto');
      
      try {
        // Usar SQL direto via Prisma
        result = await db.$executeRaw`
          INSERT INTO "LeadForm" (
            id, 
            name, 
            email, 
            whatsapp, 
            instagram, 
            area, 
            employees, 
            revenue, 
            "useTechnology", 
            status, 
            "createdAt", 
            "updatedAt"
          ) 
          VALUES (
            ${`cuid_${Date.now()}`}, 
            ${body.name}, 
            ${body.email}, 
            ${body.whatsapp}, 
            ${body.instagram || null}, 
            ${body.area}, 
            ${body.employees}, 
            ${body.revenue}, 
            ${body.useTechnology}, 
            'Novo', 
            CURRENT_TIMESTAMP, 
            CURRENT_TIMESTAMP
          )
        `;
        
        console.log('[API] SQL executado com sucesso:', result);
        
        return NextResponse.json(
          { success: true, data: { ...body, id: `cuid_${Date.now()}` } },
          { status: 201 }
        );
      } catch (sqlError) {
        console.error('[API] Erro ao executar SQL:', sqlError);
        throw sqlError;
      }
    } else {
      // Usar o modelo normalmente se estiver disponível
      try {
        const leadForm = await db.leadForm.create({
          data: {
            name: body.name,
            email: body.email,
            whatsapp: body.whatsapp,
            instagram: body.instagram || null,
            area: body.area,
            employees: body.employees,
            revenue: body.revenue,
            useTechnology: body.useTechnology,
            status: "Novo"
          },
        });
        
        console.log('[API] POST /api/leadform: Dados salvos com sucesso', leadForm);
        
        return NextResponse.json(
          { success: true, data: leadForm },
          { status: 201 }
        );
      } catch (dbError) {
        console.error('[API] POST /api/leadform: Erro ao salvar no banco', dbError);
        throw dbError;
      }
    }
    
  } catch (error) {
    console.error("[API] POST /api/leadform: Erro geral:", error);
    return NextResponse.json(
      { 
        error: "Erro ao processar solicitação", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// Buscar leads
export async function GET() {
  try {
    console.log('[API] GET /api/leadform: Iniciando busca');
    
    // Verificar se o modelo existe no objeto db
    console.log('[API] Propriedades disponíveis em db:', Object.keys(db));
    
    const leads = await db.leadForm.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    console.log('[API] GET /api/leadform: Leads encontrados:', leads.length);
    
    return NextResponse.json(
      { success: true, data: leads },
      { status: 200 }
    );
  } catch (error) {
    console.error("[API] GET /api/leadform: Erro ao buscar leads:", error);
    return NextResponse.json(
      { 
        error: "Erro ao processar solicitação", 
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
} 