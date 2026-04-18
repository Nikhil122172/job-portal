import { useEffect, useState } from 'react'
import { Star, Sparkles, MessageSquareText } from 'lucide-react'
import { Button, Input, Modal, Textarea } from '../ui'
import { createFeedbackReview, saveFeedbackReview } from '../../utils/feedback'
import toast from 'react-hot-toast'

type FeedbackPromptModalProps = {
  open: boolean
  onClose: () => void
  title: string
  description: string
  defaultName: string
  defaultRole: string
}

export function FeedbackPromptModal({ open, onClose, title, description, defaultName, defaultRole }: FeedbackPromptModalProps) {
  const [name, setName] = useState(defaultName)
  const [role, setRole] = useState(defaultRole)
  const [text, setText] = useState('')
  const [rating, setRating] = useState(5)
  const [ratingHover, setRatingHover] = useState<number | null>(null)
  const [errors, setErrors] = useState<{
    name?: string
    role?: string
    text?: string
    rating?: string
  }>({})

  useEffect(() => {
    if (!open) return

    setName(defaultName)
    setRole(defaultRole)
    setText('')
    setRating(5)
    setRatingHover(null)
    setErrors({})
  }, [defaultName, defaultRole, open])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    const trimmedName = name.trim()
    const trimmedRole = role.trim()
    const trimmedText = text.trim()
    const nextErrors: {
      name?: string
      role?: string
      text?: string
      rating?: string
    } = {}

    if (!trimmedName) {
      nextErrors.name = 'Name is required.'
    } else if (trimmedName.length < 2) {
      nextErrors.name = 'Name must be at least 2 characters.'
    }

    if (!trimmedRole) {
      nextErrors.role = 'Role is required.'
    } else if (trimmedRole.length < 2) {
      nextErrors.role = 'Role must be at least 2 characters.'
    }

    if (!trimmedText) {
      nextErrors.text = 'Feedback is required.'
    } else if (trimmedText.length < 10) {
      nextErrors.text = 'Feedback must be at least 10 characters.'
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      nextErrors.rating = 'Rating must be between 1 and 5.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      toast.error('Please correct the highlighted fields.')
      return
    }

    setErrors({})

    saveFeedbackReview(createFeedbackReview({ name: trimmedName, role: trimmedRole, text: trimmedText, rating }))
    toast.success('Thank you for your feedback')
    onClose()
  }

  const activeRating = ratingHover ?? rating
  const ratingLabels: Record<number, string> = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very good',
    5: 'Excellent',
  }

  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-2xl border border-brand-100 bg-gradient-to-r from-brand-50 via-cyan-50 to-slate-50 p-4 dark:border-slate-700 dark:from-slate-800 dark:via-slate-800 dark:to-slate-800/80">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-2xl bg-white/80 p-2 text-brand-600 shadow-sm dark:bg-slate-900/80 dark:text-brand-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-slate-900 dark:text-slate-100">{description}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Your feedback will appear on the homepage reviews if it is helpful to other users.</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-800/40">
          <h4 className="font-display text-display-sm font-semibold text-slate-900 dark:text-slate-100">Quick feedback form</h4>
          <p className="mt-1 text-body-xs text-slate-500 dark:text-slate-400">Tell us in a few lines how your experience felt.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Your name"
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setErrors((prev) => ({ ...prev, name: undefined }))
            }}
            placeholder="Your name"
            maxLength={60}
            error={errors.name}
          />
          <Input
            label="Your role"
            value={role}
            onChange={(event) => {
              setRole(event.target.value)
              setErrors((prev) => ({ ...prev, role: undefined }))
            }}
            placeholder="Job seeker, recruiter, or company"
            maxLength={120}
            error={errors.role}
          />
        </div>

        <div className="space-y-2">
          <label className="label">How would you rate the experience?</label>
          <div className={errors.rating ? 'rounded-xl border border-red-400 px-3 py-3' : 'rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-3'}>
            <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((value) => {
              const active = value <= activeRating
              return (
                <button
                  key={value}
                  type="button"
                  onMouseEnter={() => setRatingHover(value)}
                  onMouseLeave={() => setRatingHover(null)}
                  onFocus={() => setRatingHover(value)}
                  onBlur={() => setRatingHover(null)}
                  onClick={() => {
                    setRating(value)
                    setErrors((prev) => ({ ...prev, rating: undefined }))
                  }}
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-all ${active ? 'border-amber-300 bg-amber-50 text-amber-500 shadow-sm dark:border-amber-500/40 dark:bg-amber-500/10' : 'border-slate-200 bg-white text-slate-300 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500'}`}
                  aria-label={`Set rating to ${value}`}
                >
                  <Star className={active ? 'w-5 h-5 fill-current' : 'w-5 h-5'} />
                </button>
              )
            })}
            </div>
            <p className="mt-1 text-body-xs text-slate-500 dark:text-slate-400">{activeRating} / 5 - {ratingLabels[activeRating]}</p>
          </div>
          {errors.rating && <p className="text-xs text-red-500 mt-1">{errors.rating}</p>}
        </div>

        <div className="space-y-1.5">
          <Textarea
            label="Tell us what stood out"
            value={text}
            onChange={(event) => {
              setText(event.target.value)
              setErrors((prev) => ({ ...prev, text: undefined }))
            }}
            placeholder="What went well? What could be better?"
            rows={5}
            maxLength={1000}
            hint="Share a short review so we can improve the experience."
            error={errors.text}
          />
          <div className="flex items-center justify-end">
            <p className={text.length > 900 ? 'text-xs font-medium text-amber-600 dark:text-amber-400' : 'text-xs font-medium text-slate-500 dark:text-slate-400'}>{text.length}/1000</p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={onClose} className="sm:min-w-32">
            Not now
          </Button>
          <Button type="submit" className="sm:min-w-40">
            <MessageSquareText className="w-4 h-4" />
            Submit feedback
          </Button>
        </div>
      </form>
    </Modal>
  )
}