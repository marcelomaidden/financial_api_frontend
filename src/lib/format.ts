export function formatMoney(value: number, currencyCode = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currencyCode }).format(value)
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '-'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('pt-BR')
}
