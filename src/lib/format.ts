export function formatMoney(value: number, currencyCode = 'BRL'): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currencyCode }).format(value)
}

const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/

// Data inválida (ex.: mês 13) vira Invalid Date em vez de rolar para o ano seguinte.
function localDate(year: number, month: number, day: number): Date {
  const date = new Date(year, month - 1, day)
  const valid = date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
  return valid ? date : new Date(NaN)
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '-'
  // Data sem hora: `new Date('yyyy-mm-dd')` seria UTC e mostraria o dia anterior a oeste de UTC.
  const match = DATE_ONLY.exec(iso)
  const date = match ? localDate(Number(match[1]), Number(match[2]), Number(match[3])) : new Date(iso)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('pt-BR')
}
