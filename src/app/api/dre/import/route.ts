import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';

// Add helper function to format cost center code
function formatCostCenterCode(code: string | number): string {
  // Convert to string and remove any non-numeric characters
  const numericCode = String(code).replace(/\D/g, '');
  // Pad with zeros if necessary to ensure 6 digits
  return numericCode.padStart(6, '0');
}

async function processRecords(records: any[]) {
  try {
    // Log para debug
    console.log('Processando registros:', records[0]);

    // Helper function to get cost center code from record
    function getCostCenterCode(record: any): string {
      const code = record['costCenter.code'] || 
                  (record.costCenter && record.costCenter.code) || 
                  record['Cost Center'];
      console.log('Extracted cost center code:', code, 'from record:', record);
      return formatCostCenterCode(code);
    }

    // Primeiro, vamos coletar todos os SKUs e códigos de centro de custo únicos
    const uniqueSkus = [...new Set(records.map(record => record.productSku))];
    const uniqueCostCenters = [...new Set(records.map(record => getCostCenterCode(record)))];

    console.log('SKUs únicos encontrados:', uniqueSkus);
    console.log('Centros de custo únicos encontrados:', uniqueCostCenters);

    // Buscar produtos existentes
    const existingProducts = await prisma.productInfo.findMany({
      where: {
        sku: {
          in: uniqueSkus
        }
      }
    });
    const existingSkus = new Set(existingProducts.map(p => p.sku));

    console.log('Produtos existentes:', existingProducts);

    // Buscar centros de custo existentes
    const existingCostCenters = await prisma.costCenterInfo.findMany({
      where: {
        code: {
          in: uniqueCostCenters
        }
      }
    });
    const existingCostCenterCodes = new Set(existingCostCenters.map(cc => cc.code));

    console.log('Centros de custo existentes:', existingCostCenters);

    // Criar produtos que não existem
    const newProducts = uniqueSkus.filter(sku => !existingSkus.has(sku));
    if (newProducts.length > 0) {
      console.log('Criando novos produtos:', newProducts);
      const createdProducts = await prisma.productInfo.createMany({
        data: newProducts.map(sku => ({
          sku,
          description: records.find(r => r.productSku === sku)?.['product.description'] || sku
        })),
        skipDuplicates: true
      });
      console.log('Produtos criados:', createdProducts);
    }

    // Criar centros de custo que não existem
    const newCostCenters = uniqueCostCenters.filter(code => !existingCostCenterCodes.has(code));
    if (newCostCenters.length > 0) {
      console.log('Criando novos centros de custo:', newCostCenters);
      try {
        const createdCostCenters = await prisma.costCenterInfo.createMany({
          data: newCostCenters.map(code => {
            const formattedCode = formatCostCenterCode(code);
            console.log('Formatando código do centro de custo:', { original: code, formatted: formattedCode });
            return {
              code: formattedCode,
              description: records.find(r => getCostCenterCode(r) === code)?.['costCenter.description'] || code
            };
          }),
          skipDuplicates: true
        });
        console.log('Centros de custo criados com sucesso:', createdCostCenters);

        // Verificar se os centros de custo foram realmente criados
        const verifiedCostCenters = await prisma.costCenterInfo.findMany({
          where: {
            code: {
              in: newCostCenters
            }
          }
        });
        console.log('Centros de custo verificados após criação:', verifiedCostCenters);
      } catch (error) {
        console.error('Erro ao criar centros de custo:', error);
        throw error;
      }
    }

    // Agora podemos criar os registros do DRE com segurança
    const dreRecords = records.map(record => {
      const costCenterCode = getCostCenterCode(record);
      const mappedRecord = {
        period: record.period,
        version: record.version,
        scenario: record.scenario,
        bu: record.bu,
        region: record.region,
        channel: record.channel,
        productSku: record.productSku,
        customer: record.customer,
        costCenterCode: costCenterCode,
        glAccount: record.glAccount,
        pnlLine: record.pnlLine,
        value: typeof record.value === 'string' ? parseFloat(record.value) : record.value,
      };
      console.log('Registro DRE mapeado:', {
        ...mappedRecord,
        costCenterDetails: {
          original: record.costCenter,
          extracted: costCenterCode,
          exists: existingCostCenterCodes.has(costCenterCode)
        }
      });
      return mappedRecord;
    });

    try {
      const dreResult = await prisma.factEntry.createMany({
        data: dreRecords,
        skipDuplicates: true
      });
      console.log('Resultado da criação dos registros DRE:', dreResult);

      // Verificar alguns registros criados
      const sampleEntries = await prisma.factEntry.findMany({
        where: {
          costCenterCode: {
            in: uniqueCostCenters.slice(0, 3) // Verificar os 3 primeiros
          }
        },
        include: {
          costCenter: true
        }
      });
      console.log('Amostra de registros criados:', sampleEntries);

      return dreResult;
    } catch (error) {
      console.error('Erro ao criar registros DRE:', error);
      throw error;
    }
  } catch (error) {
    console.error('Erro no processamento dos registros:', error);
    throw error;
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const fileType = formData.get('fileType') as string;
    const columnMapping = JSON.parse(formData.get('columnMapping') as string);
    const previewData = JSON.parse(formData.get('previewData') as string);

    console.log('Mapeamento de colunas recebido:', columnMapping);
    console.log('Preview data recebido:', previewData[0]);

    if (!file) {
      return NextResponse.json(
        { error: 'Nenhum arquivo enviado' },
        { status: 400 }
      );
    }

    let records: any[] = [];

    // Se temos dados de preview, usamos eles diretamente
    if (previewData && previewData.length > 0) {
      records = previewData;
    } else {
      // Caso contrário, processamos o arquivo
      if (fileType === 'csv') {
        const csvText = await file.text();
        const parsedRecords = parse(csvText, {
          columns: true,
          skip_empty_lines: true,
        });
        
        records = parsedRecords.map((record: any) => {
          const mappedRecord: Record<string, any> = {};
          Object.entries(columnMapping).forEach(([dbField, fileColumn]) => {
            if (typeof fileColumn === 'string' && fileColumn in record) {
              mappedRecord[dbField] = record[fileColumn];
            }
          });
          return mappedRecord;
        });
      } else if (fileType === 'xlsx' || fileType === 'xls') {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const parsedRecords = XLSX.utils.sheet_to_json(worksheet);

        records = parsedRecords.map((record: any) => {
          const mappedRecord: Record<string, any> = {};
          Object.entries(columnMapping).forEach(([dbField, fileColumn]) => {
            if (typeof fileColumn === 'string' && fileColumn in record) {
              mappedRecord[dbField] = record[fileColumn];
            }
          });
          return mappedRecord;
        });
      } else {
        return NextResponse.json(
          { error: 'Formato de arquivo não suportado' },
          { status: 400 }
        );
      }
    }

    console.log('Registros após mapeamento:', records[0]);

    if (!records.length) {
      return NextResponse.json(
        { error: 'Arquivo vazio ou sem dados válidos' },
        { status: 400 }
      );
    }

    // Validar os dados antes de processar
    const invalidRecords = records.filter(record => {
      const costCenterCode = record['costCenter.code'] || record.costCenter?.code;
      const isInvalid = !record.period || 
                       !record.productSku || 
                       !costCenterCode || 
                       isNaN(parseFloat(record.value));
      
      if (isInvalid) {
        console.log('Registro inválido encontrado:', record);
      }
      return isInvalid;
    });

    if (invalidRecords.length > 0) {
      console.log('Registros inválidos:', invalidRecords);
      return NextResponse.json({
        error: 'Dados inválidos encontrados',
        invalidRecords
      }, { status: 400 });
    }

    const result = await processRecords(records);

    return NextResponse.json({
      message: `${result.count} registros importados com sucesso`,
      details: {
        totalProcessed: records.length,
        importedCount: result.count
      }
    });
  } catch (error: any) {
    console.error('Erro ao importar arquivo:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Erro ao importar arquivo',
        details: error
      },
      { status: 500 }
    );
  }
} 