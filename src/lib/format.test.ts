import { formatDate } from './format'

describe('formatDate', () => {
  it('mantém o dia de uma data sem hora', () => {
    expect(formatDate('2028-01-15')).toBe('15/01/2028')
    expect(formatDate('2022-08-01')).toBe('01/08/2022')
  })

  it('mantém o resultado de datas com hora', () => {
    expect(formatDate('2026-11-20T00:00:00')).toBe('20/11/2026')
    expect(formatDate('2026-11-10T12:00:00Z')).toBe('10/11/2026')
  })

  it('devolve "-" para nulo, vazio e texto inválido', () => {
    expect(formatDate(null)).toBe('-')
    expect(formatDate(undefined)).toBe('-')
    expect(formatDate('')).toBe('-')
    expect(formatDate('abc')).toBe('-')
    expect(formatDate('2026-13-45')).toBe('-')
  })
})
