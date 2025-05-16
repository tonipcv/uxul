export const formatCurrency = (value: number) => {
  // Para valores em milhões (>=1M)
  if (Math.abs(value) >= 1000000) {
    return `R$ ${(value / 1000000).toFixed(1)}M`;
  }
  // Para valores em milhares (>=1K)
  if (Math.abs(value) >= 1000) {
    return `R$ ${(value / 1000).toFixed(1)}K`;
  }
  // Para valores menores que 1000
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}; 