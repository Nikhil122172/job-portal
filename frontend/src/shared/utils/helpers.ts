import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { formatDistanceToNow, format } from 'date-fns'

function parseApiDate(date: string): Date {
  const hasTimeZone = /(?:Z|[+-]\d{2}:\d{2})$/i.test(date)
  const normalized = hasTimeZone ? date : `${date}Z`
  return new Date(normalized)
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '-'
  try {
    return format(parseApiDate(date), 'MMM d, yyyy')
  } catch {
    return date
  }
}

export function timeAgo(date: string | null | undefined): string {
  if (!date) return '-'
  try {
    return formatDistanceToNow(parseApiDate(date), { addSuffix: true })
  } catch {
    return date
  }
}

export function formatSalary(min?: number, max?: number, currency = 'USD'): string {
  if (!min && !max) return 'Not specified'
  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n)
  if (min && max) return `${fmt(min)} – ${fmt(max)}`
  if (min) return `From ${fmt(min)}`
  return `Up to ${fmt(max!)}`
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n) + '...' : str
}

export function keepTextCharacters(value: string): string {
  return value.replace(/\d+/g, '')
}

export function keepNumericCharacters(value: string): string {
  return value.replace(/\D+/g, '')
}

export function isTextOnly(value: string): boolean {
  return !/\d/.test(value)
}

export function isNumericOnly(value: string): boolean {
  return /^\d*$/.test(value)
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export const STATUS_COLORS: Record<string, string> = {
  APPLIED: 'badge-blue',
  UNDER_REVIEW: 'badge-orange',
  SHORTLISTED: 'badge-purple',
  INTERVIEW_SCHEDULED: 'badge-purple',
  OFFERED: 'badge-green',
  REJECTED: 'badge-red',
  WITHDRAWN: 'badge-slate',
  ACTIVE: 'badge-green',
  CLOSED: 'badge-slate',
  DRAFT: 'badge-orange',
  EXPIRED: 'badge-red',
}

export const JOB_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: 'Full Time',
  PART_TIME: 'Part Time',
  CONTRACT: 'Contract',
  INTERNSHIP: 'Internship',
  FREELANCE: 'Freelance',
}

export const EXP_LEVEL_LABELS: Record<string, string> = {
  ENTRY: 'Entry Level',
  JUNIOR: 'Junior',
  MID: 'Mid Level',
  SENIOR: 'Senior',
  LEAD: 'Lead / Principal',
}

export function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout>
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
