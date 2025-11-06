import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: 'USD' | 'BSF' = 'USD'): string {
  return new Intl.NumberFormat('es-VE', {
    style: 'currency',
    currency: currency === 'USD' ? 'USD' : 'VES',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function generateRepresentativeCode(): string {
  const random = Math.floor(10000 + Math.random() * 90000)
  return `REP-${random}`
}

export function generateTeacherCode(): string {
  const random = Math.floor(10000 + Math.random() * 90000)
  return `DOC-${random}`
}

