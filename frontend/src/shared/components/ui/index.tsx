import { type ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, forwardRef } from 'react'
import { cn, keepNumericCharacters, keepTextCharacters } from '../../utils/helpers'
import { Loader2, X, ArrowLeft, ArrowRight } from 'lucide-react'

// ── Button ────────────────────────────────────────────────────────────────────
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', className, type = 'button', ...props }, ref) => {
    const variants = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      ghost: 'btn-ghost',
      danger: 'btn-danger',
    }

    const sizes = {
      sm: 'px-3 py-2 text-xs',
      md: 'px-5 py-2.5 text-sm',
      lg: 'px-6 py-3 text-base',
    }

    return (
      <button
        ref={ref}
        type={type}
        className={cn(variants[variant], sizes[size], className)}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 'md', className }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' }
  return <Loader2 className={cn('animate-spin text-brand-500', sizes[size], className)} />
}

export function PageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Spinner size="lg" />
    </div>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('shimmer h-4 w-full', className)} />
}

// ── Input ─────────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  rightIcon?: ReactNode
  characterMode?: 'text' | 'numeric'
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, rightIcon, characterMode, onChange, onPaste, onKeyDown, inputMode, pattern, ...props }, ref) => {
    const sanitizeValue = (value: string) => {
      if (characterMode === 'numeric') return keepNumericCharacters(value)
      if (characterMode === 'text') return keepTextCharacters(value)
      return value
    }

    const handleChange: InputHTMLAttributes<HTMLInputElement>['onChange'] = (event) => {
      if (characterMode) {
        const sanitized = sanitizeValue(event.currentTarget.value)
        if (sanitized !== event.currentTarget.value) {
          event.currentTarget.value = sanitized
        }
      }
      onChange?.(event)
    }

    const handlePaste: InputHTMLAttributes<HTMLInputElement>['onPaste'] = (event) => {
      if (!characterMode) {
        onPaste?.(event)
        return
      }

      const pastedText = event.clipboardData.getData('text')
      const sanitized = sanitizeValue(pastedText)
      if (sanitized !== pastedText) {
        event.preventDefault()
        const input = event.currentTarget
        const start = input.selectionStart ?? input.value.length
        const end = input.selectionEnd ?? input.value.length
        const nextValue = `${input.value.slice(0, start)}${sanitized}${input.value.slice(end)}`
        input.value = sanitizeValue(nextValue)
        input.dispatchEvent(new Event('input', { bubbles: true }))
        return
      }

      onPaste?.(event)
    }

    const handleKeyDown: InputHTMLAttributes<HTMLInputElement>['onKeyDown'] = (event) => {
      if (characterMode === 'numeric') {
        const allowedKeys = [
          'Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End',
        ]
        const isShortcut = event.ctrlKey || event.metaKey
        const isAllowedKey = allowedKeys.includes(event.key) || isShortcut
        if (!isAllowedKey && !/^\d$/.test(event.key)) {
          event.preventDefault()
        }
      }

      if (characterMode === 'text' && /^\d$/.test(event.key)) {
        event.preventDefault()
      }

      onKeyDown?.(event)
    }

    return (
      <div className="space-y-1.5">
        {label && <label className="label">{label}</label>}
        <div className="relative">
          <input
            ref={ref}
            inputMode={inputMode ?? (characterMode === 'numeric' ? 'numeric' : undefined)}
            pattern={pattern ?? (characterMode === 'numeric' ? '[0-9]*' : undefined)}
            className={cn('input-field', rightIcon && 'pr-10', error && 'input-error', className)}
            onChange={handleChange}
            onPaste={handlePaste}
            onKeyDown={handleKeyDown}
            {...props}
          />
          {rightIcon && <div className="absolute inset-y-0 right-3 flex items-center">{rightIcon}</div>}
        </div>
        {error && <p className="text-xs font-medium text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-400" />
          {error}
        </p>}
        {hint && !error && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
      </div>
    )
  },
)
Input.displayName = 'Input'

// ── Textarea ──────────────────────────────────────────────────────────────────
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="label">{label}</label>}
      <textarea
        ref={ref}
        className={cn('input-field resize-none', error && 'input-error', className)}
        {...props}
      />
      {error && <p className="text-xs font-medium text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-400" />
        {error}
      </p>}
      {hint && !error && <p className="text-xs text-slate-500 mt-1">{hint}</p>}
    </div>
  ),
)
Textarea.displayName = 'Textarea'

// ── Select ────────────────────────────────────────────────────────────────────
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="label">{label}</label>}
      <select
        ref={ref}
        className={cn('input-field bg-white dark:bg-slate-800', error && 'input-error', className)}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs font-medium text-red-600 dark:text-red-400 mt-1.5 flex items-center gap-1">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-600 dark:bg-red-400" />
        {error}
      </p>}
    </div>
  ),
)
Select.displayName = 'Select'

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('badge', className)}>{children}</span>
}

// ── Avatar ────────────────────────────────────────────────────────────────────
export function Avatar({ name, src, size = 'md' }: { name: string; src?: string | null; size?: 'sm' | 'md' | 'lg' | 'xl' }) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-12 w-12 text-base', xl: 'h-16 w-16 text-lg' }
  const initials = name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)

  if (src) {
    return <img src={src} alt={name} className={cn('rounded-full object-cover ring-2 ring-white dark:ring-slate-800', sizes[size])} />
  }
  return (
    <div className={cn('rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold ring-2 ring-white dark:ring-slate-800', sizes[size])}>
      {initials}
    </div>
  )
}

// ── Empty State ───────────────────────────────────────────────────────────────
export function EmptyState({ title, description, icon, action }: {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="mb-4 text-slate-300 dark:text-slate-600">{icon}</div>}
      <h3 className="font-display text-display-lg font-semibold text-slate-700 dark:text-slate-300">{title}</h3>
      {description && <p className="mt-2 text-body-sm text-slate-500 max-w-sm">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }: {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  maxWidth?: string
}) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full animate-scale-in max-h-[calc(100vh-2rem)] flex flex-col my-4', maxWidth)}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <h3 className="font-display text-display-lg font-semibold">{title}</h3>
            <button onClick={onClose} className="btn-ghost p-1.5 rounded-lg" aria-label="Close modal">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="p-6 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

// ── Pagination ────────────────────────────────────────────────────────────────
export function Pagination({ page, totalPages, onPageChange }: {
  page: number
  totalPages: number
  onPageChange: (p: number) => void
}) {
  if (totalPages <= 1) return null
  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i)

  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 0}
        className="btn-ghost px-3 py-2 text-sm disabled:opacity-40"
      >
        <span className="inline-flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Prev
        </span>
      </button>
      {pages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={cn(
            'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
            p === page
              ? 'bg-brand-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800',
          )}
        >{p + 1}</button>
      ))}
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages - 1}
        className="btn-ghost px-3 py-2 text-sm disabled:opacity-40"
      >
        <span className="inline-flex items-center gap-1">
          Next <ArrowRight className="w-4 h-4" />
        </span>
      </button>
    </div>
  )
}

// ── Stats Card ────────────────────────────────────────────────────────────────
export function StatsCard({ label, value, icon, color = 'blue' }: {
  label: string
  value: number | string
  icon: ReactNode
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red'
}) {
  const colors = {
    blue:   'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    green:  'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    red:    'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  }
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={cn('p-3 rounded-xl', colors[color])}>{icon}</div>
      <div>
        <p className="font-display text-display-xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
        <p className="text-body-sm text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </div>
  )
}
