import { NextResponse } from 'next/server';
import { prisma, withRetry } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { DERIVED_METRICS, AVAILABLE_METRICS } from '@/types/pivot';

// Whitelist de colunas permitidas
const ALLOWED_COLUMNS = new Set([
  'pnlLine', 'customer', 'channel', 'productSku', 'version',
  'period', 'bu', 'region', 'costCenterCode', 'glAccount', 'value'
]);

// Helper para lidar com identificadores SQL de forma segura
const id = (field: string) => {
  if (!ALLOWED_COLUMNS.has(field)) {
    throw new Error(`Coluna não permitida: ${field}`);
  }
  return Prisma.raw(`"${field.replace(/[^a-zA-Z0-9_]/g, '')}"`);
};

// Helper para métricas derivadas
const buildDerivedMetric = (metric: string): Prisma.Sql => {
  const derivedMetric = DERIVED_METRICS.find(m => m.key === metric);
  if (!derivedMetric) {
    throw new Error(`Métrica derivada não encontrada: ${metric}`);
  }

  // Parse da métrica para gerar SQL seguro
  const sql = derivedMetric.calculation
    .replace(/actual/g, 'SUM(CASE WHEN version = \'Actual\' THEN value ELSE 0 END)')
    .replace(/forecast/g, 'SUM(CASE WHEN version = \'Forecast\' THEN value ELSE 0 END)')
    .replace(/revenue/g, 'SUM(CASE WHEN pnlLine = \'Net Revenue\' THEN value ELSE 0 END)')
    .replace(/cogs/g, 'SUM(CASE WHEN pnlLine = \'Cost of Goods Sold\' THEN value ELSE 0 END)')
    .replace(/ebitda/g, 'SUM(CASE WHEN pnlLine = \'EBITDA\' THEN value ELSE 0 END)')
    .replace(/current_year/g, 'SUM(CASE WHEN period >= DATE_TRUNC(\'year\', CURRENT_DATE) THEN value ELSE 0 END)')
    .replace(/previous_year/g, 'SUM(CASE WHEN period >= DATE_TRUNC(\'year\', CURRENT_DATE - INTERVAL \'1 year\') AND period < DATE_TRUNC(\'year\', CURRENT_DATE) THEN value ELSE 0 END)');

  return Prisma.sql`(${Prisma.raw(sql)})`;
};

// Schema de validação aprimorado
const PivotRequestSchema = z.object({
  filters: z.object({
    scenario: z.string().optional(),
    version: z.array(z.string()).optional(),
    period: z.array(z.string()).optional(),
    bu: z.array(z.string()).optional(),
  }).optional(),
  rows: z.array(z.string()).refine(
    rows => rows.every(row => ALLOWED_COLUMNS.has(row)),
    'Colunas inválidas em rows'
  ),
  columns: z.array(z.string()).refine(
    cols => cols.every(col => ALLOWED_COLUMNS.has(col)),
    'Colunas inválidas em columns'
  ),
  metrics: z.array(z.string()).refine(
    metrics => metrics.every(m => 
      AVAILABLE_METRICS.some(am => am.key === m) || 
      DERIVED_METRICS.some(dm => dm.key === m)
    ),
    'Métricas inválidas'
  ),
  sortBy: z.object({
    field: z.string(),
    direction: z.enum(['asc', 'desc'])
  }).optional(),
  page: z.number().optional().default(1),
  pageSize: z.number().optional().default(100),
});

interface QueryResult {
  [key: string]: string | number;
}

interface TotalsResult {
  [key: string]: number;
}

export async function POST(req: Request) {
  try {
    console.log('Iniciando processamento da requisição pivot');
    const body = await req.json();
    
    // Validate request body
    const validatedData = PivotRequestSchema.safeParse(body);
    
    if (!validatedData.success) {
      console.error('Erro de validação:', validatedData.error.errors);
      return NextResponse.json(
        { message: 'Invalid request data', errors: validatedData.error.errors },
        { status: 400 }
      );
    }

    const { filters, rows, columns, metrics, sortBy, page = 1, pageSize = 100 } = validatedData.data;

    // Validate metrics exist
    const invalidMetrics = metrics.filter(m => 
      !AVAILABLE_METRICS.some(am => am.key === m) && 
      !DERIVED_METRICS.some(dm => dm.key === m)
    );

    if (invalidMetrics.length > 0) {
      console.error('Métricas inválidas:', invalidMetrics);
      return NextResponse.json(
        { message: `Invalid metrics: ${invalidMetrics.join(', ')}` },
        { status: 400 }
      );
    }

    // Build and execute queries with error handling and retry
    try {
      console.log('API Request:', { filters, rows, columns, metrics });

      // Construir a query base
      const baseQuery = Prisma.sql`
        FROM "FactEntry"
        WHERE 1=1
        ${filters?.scenario ? Prisma.sql`AND scenario = ${filters.scenario}` : Prisma.empty}
        ${filters?.version?.length ? Prisma.sql`AND version = ANY(${filters.version}::text[])` : Prisma.empty}
        ${filters?.period?.length ? Prisma.sql`AND period = ANY(${filters.period}::text[])` : Prisma.empty}
        ${filters?.bu?.length ? Prisma.sql`AND bu = ANY(${filters.bu}::text[])` : Prisma.empty}
      `;

      // Query para contar total de registros com retry
      const countQuery = Prisma.sql`
        WITH distinct_rows AS (
          SELECT DISTINCT ${Prisma.join(rows.map(r => id(r)), ', ')}
          ${baseQuery}
        )
        SELECT COUNT(1) as count FROM distinct_rows
      `;

      console.log('Executando count query');
      const [{ count }] = await withRetry(() => 
        prisma.$queryRaw<[{ count: bigint }]>(countQuery)
      );
      const totalCount = Number(count);
      console.log('Total Count:', totalCount);

      // Se não houver registros, retornar resultado vazio
      if (totalCount === 0) {
        return NextResponse.json({
          data: [],
          totals: {},
          metadata: { page, pageSize, total: 0 }
        });
      }

      // Query principal com retry
      let mainQuery = Prisma.sql`
        WITH base_data AS (
          SELECT 
            ${Prisma.join(rows.map(r => id(r)), ', ')},
            ARRAY_AGG(
              jsonb_build_object(
                'period', period,
                'version', version,
                'value', value,
                'scenario', scenario,
                'bu', bu
              )
            ) as details
      `;

      // Adicionar métricas base e derivadas
      if (!columns.length) {
        const metricsSql = metrics.map(metric => {
          if (DERIVED_METRICS.some(dm => dm.key === metric)) {
            return Prisma.sql`${buildDerivedMetric(metric)} as "${metric}"`;
          }
          return Prisma.sql`${Prisma.raw(metric)} as "${metric}"`;
        });
        
        mainQuery = Prisma.sql`${mainQuery},
          ${Prisma.join(metricsSql, ',\n')}
        `;
      }

      // Adicionar colunas pivotadas
      if (columns.length > 0) {
        const uniqueValues = await prisma.$queryRaw<Array<{[key: string]: string}>>`
          SELECT DISTINCT ${id(columns[0])}
          FROM "FactEntry" 
          WHERE ${id(columns[0])} IS NOT NULL 
          ORDER BY ${id(columns[0])}
        `;

        console.log('Unique Values Query Result:', uniqueValues);

        const columnValues = uniqueValues.map(row => String(row[columns[0]]));
        console.log('Column Values:', columnValues);

        // Construir subconsultas para cada valor de coluna
        const pivotColumns = columnValues.map(valueFromColumn => {
          const aliasName = valueFromColumn.replace(/[^a-zA-Z0-9_]/g, '_');
          return Prisma.sql`
            SUM(
              CASE WHEN ${id(columns[0])} = ${valueFromColumn}
                   THEN ${id('value')}
                   ELSE NULL
              END
            ) AS ${Prisma.raw('"' + aliasName + '"')}
          `;
        });

        mainQuery = Prisma.sql`${mainQuery},
          ${Prisma.join(pivotColumns, ',\n')}
        `;
      }

      // Completar a query principal
      mainQuery = Prisma.sql`${mainQuery}
        ${baseQuery}
        GROUP BY ${Prisma.join(rows.map(r => id(r)), ', ')}
        )
        SELECT *, details::jsonb[] as details
        FROM base_data
        ${sortBy ? Prisma.sql`ORDER BY ${id(sortBy.field)} ${Prisma.raw(sortBy.direction)}` : Prisma.empty}
        LIMIT ${pageSize}
        OFFSET ${(page - 1) * pageSize}
      `;

      console.log('Executando main query');
      const result = await withRetry(() => 
        prisma.$queryRaw<QueryResult[]>(mainQuery)
      );
      console.log('Query Result Sample:', result.slice(0, 2));

      // Query de totais com retry
      const totalsQuery = Prisma.sql`
        SELECT 
          ${Prisma.join(metrics.map(metric => {
            if (DERIVED_METRICS.some(dm => dm.key === metric)) {
              return Prisma.sql`${buildDerivedMetric(metric)} as "${metric}"`;
            }
            return Prisma.sql`${metric} as "${metric}"`;
          }), ',\n')}
        ${baseQuery}
      `;

      console.log('Executando totals query');
      const [totals] = await withRetry(() => 
        prisma.$queryRaw<TotalsResult[]>(totalsQuery)
      );
      console.log('Totals:', totals);

      // Validate result format
      if (!Array.isArray(result)) {
        throw new Error('Invalid query result format');
      }

      return NextResponse.json({
        data: result,
        totals: totals || {},
        metadata: {
          page,
          pageSize,
          total: Number(count) || 0
        }
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { 
          message: 'Database query failed', 
          error: dbError instanceof Error ? dbError.message : 'Unknown error',
          details: process.env.NODE_ENV === 'development' ? dbError : undefined
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { 
        message: 'Internal server error', 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
} 