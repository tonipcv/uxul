import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { PivotRequest, PivotResponse } from '@/types/pivot';

async function fetchPivotData(config: PivotRequest): Promise<PivotResponse> {
  console.log('Fetching pivot data with config:', config);

  const response = await fetch('/api/pivot/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao carregar dados');
  }

  const rawData = await response.json();
  console.log('Raw API Response:', rawData);

  // Validar a estrutura dos dados
  if (!rawData.data || !Array.isArray(rawData.data)) {
    console.error('Invalid data structure:', rawData);
    throw new Error('Estrutura de dados inválida');
  }

  // Processar e validar os dados
  const processedData = rawData.data.map((row: Record<string, any>, index: number) => {
    const processedRow = { ...row };
    
    // Processar cada campo do registro
    Object.entries(row).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        console.warn(`Null/undefined value found for key "${key}" in row ${index}`);
        processedRow[key] = 0; // Converter null/undefined para 0
      } else if (typeof value === 'string' && !isNaN(Number(value))) {
        // Converter strings numéricas para números
        processedRow[key] = Number(value);
      } else if (typeof value === 'number') {
        // Garantir que é um número válido
        processedRow[key] = isNaN(value) ? 0 : value;
      }
    });

    return processedRow;
  });

  console.log('Processed data sample:', processedData.slice(0, 2));

  // Construir resposta processada
  const processedResponse: PivotResponse = {
    data: processedData,
    totals: {
      total_value: Number(rawData.totals?.total_value || 0),
    },
    metadata: {
      page: Number(rawData.metadata?.page || 1),
      pageSize: Number(rawData.metadata?.pageSize || 100),
      total: Number(rawData.metadata?.total || 0)
    }
  };

  console.log('Final processed response:', {
    dataSample: processedResponse.data.slice(0, 2),
    totals: processedResponse.totals,
    metadata: processedResponse.metadata
  });

  return processedResponse;
}

export function usePivotData(config: PivotRequest): UseQueryResult<PivotResponse, Error> {
  return useQuery({
    queryKey: ['pivot', config],
    queryFn: () => fetchPivotData(config),
    staleTime: 1000 * 60 * 5, // 5 minutos
    gcTime: 1000 * 60 * 30, // 30 minutos
    retry: 2,
    refetchOnWindowFocus: false
  });
} 