import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return format(parseISO(dateStr), 'dd/MM/yyyy', { locale: es })
}

export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '-'
  return format(parseISO(dateStr), 'dd/MM/yyyy HH:mm', { locale: es })
}

export function formatCurrency(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('es-EC', {
    style: 'currency',
    currency: 'USD',
  }).format(num)
}

export function formatPercent(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return `${num.toFixed(1)}%`
}
