import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

// Schema de validação para a requisição
const PivotRequestSchema = z.object({
  filters: z.object({
    scenario: z.string().optional(),
    version: z.array(z.string()).optional(),
    period: z.array(z.string()).optional(),
    bu: z.array(z.string()).optional(),
  }).optional(),
  rows: z.array(z.string()),
  columns: z.array(z.string()),
  metrics: z.array(z.string()),
  sortBy: z.object({
    field: z.string(),
    direction: z.enum(['asc', 'desc'])
  }).optional(),
  page: z.number().optional(),
  pageSize: z.number().optional(),
});

interface QueryResult {
  [key: string]: string | number;
}

interface TotalsResult {
  total_value: number;
  [key: string]: number;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { filters, rows, columns, metrics, sortBy, page = 1, pageSize = 100 } = PivotRequestSchema.parse(body);

    console.log('API Request:', { filters, rows, columns, metrics });

    // Construir a query base
    const baseQuery = Prisma.sql`
      FROM "FactEntry"
      WHERE 1=1
      ${filters?.scenario ? Prisma.sql` AND scenario = ${filters.scenario}` : Prisma.empty}
      ${filters?.version?.length ? Prisma.sql` AND version = ANY(${filters.version}::text[])` : Prisma.empty}
    `;

    // Query para contar total de registros
    const countQuery = Prisma.sql`
      WITH distinct_rows AS (
        SELECT DISTINCT ${Prisma.raw(rows.map(r => `"${r}"`).join(', '))}
        ${baseQuery}
      )
      SELECT COUNT(1) as count FROM distinct_rows
    `;

    console.log('Count Query:', countQuery.sql);
    const [{ count }] = await prisma.$queryRaw<[{ count: bigint }]>(countQuery);
    const totalCount = Number(count);
    console.log('Total Count:', totalCount);

    // Se não houver registros, retornar resultado vazio
    if (totalCount === 0) {
      return NextResponse.json({
        data: [],
        totals: { total_value: 0 },
        metadata: { page, pageSize, total: 0 }
      });
    }

    // Query principal
    let mainQuery = Prisma.sql`
      SELECT 
        ${Prisma.raw(rows.map(r => `"${r}"`).join(', '))}
    `;

    // Adicionar métricas base
    if (!columns.length) {
      mainQuery = Prisma.sql`${mainQuery},
        ${Prisma.raw(metrics.map(metric => {
          if (metric === 'SUM(value)') {
            return 'SUM(value) as value';
          }
          return metric;
        }).join(', '))}
      `;
    }

    // Adicionar colunas pivotadas
    if (columns.length > 0) {
      const uniqueValues = await prisma.$queryRaw<Array<{[key: string]: string}>>`
        SELECT DISTINCT "${Prisma.raw(columns[0])}" 
        FROM "FactEntry" 
        WHERE "${Prisma.raw(columns[0])}" IS NOT NULL 
        ORDER BY "${Prisma.raw(columns[0])}"
      `;

      console.log('Unique Values Query Result:', uniqueValues);

      const columnValues = uniqueValues.map(row => String(row[columns[0]]));
      console.log('Column Values:', columnValues);

      // Construir subconsultas para cada valor de coluna
      const pivotColumns = columnValues.map(value => {
        const safeColumnAlias = value.replace(/[^a-zA-Z0-9_]/g, '_');
        return `COALESCE(SUM(CASE 
          WHEN "${columns[0]}" = '${value}' THEN "value"
          ELSE 0 
        END), 0) as "${safeColumnAlias}"`;
      });

      mainQuery = Prisma.sql`${mainQuery},
        ${Prisma.raw(pivotColumns.join(',\n'))}
      `;
    }

    // Completar a query principal
    mainQuery = Prisma.sql`${mainQuery}
      ${baseQuery}
      GROUP BY ${Prisma.raw(rows.map(r => `"${r}"`).join(', '))}
      ${sortBy ? Prisma.sql`ORDER BY "${sortBy.field}" ${Prisma.raw(sortBy.direction)}` : Prisma.empty}
      LIMIT ${pageSize}
      OFFSET ${(page - 1) * pageSize}
    `;

    console.log('Final Query:', mainQuery.sql);

    const result = await prisma.$queryRaw<QueryResult[]>(mainQuery);
    console.log('Query Result Sample:', result.slice(0, 2));

    // Query de totais
    const totalsQuery = Prisma.sql`
      SELECT 
        ${Prisma.raw(metrics.map(metric => {
          if (metric === 'SUM(value)') {
            return 'SUM("value") as total_value';
          }
          return metric;
        }).join(', '))}
      ${baseQuery}
    `;

    const [totals] = await prisma.$queryRaw<TotalsResult[]>(totalsQuery);
    console.log('Totals:', totals);

    const response = {
      data: result,
      totals,
      metadata: {
        page,
        pageSize,
        total: totalCount
      }
    };

    console.log('API Response Sample:', {
      firstRow: response.data[0],
      totals: response.totals,
      metadata: response.metadata
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Erro ao processar pivot:', error);
    return NextResponse.json(
      { error: 'Erro ao processar pivot' },
      { status: 500 }
    );
  }
} 