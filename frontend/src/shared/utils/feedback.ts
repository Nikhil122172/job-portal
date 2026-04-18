export type FeedbackReview = {
  id: string
  name: string
  role: string
  text: string
  rating: number
  avatar: string
}

export const FEEDBACK_STORAGE_KEY = 'talentbridge_feedback_reviews_v1'

export const toFeedbackAvatar = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

export const loadFeedbackReviews = (): FeedbackReview[] => {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(FEEDBACK_STORAGE_KEY)
    if (!raw) return []

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed.filter((item) =>
      item
      && typeof item.id === 'string'
      && typeof item.name === 'string'
      && typeof item.role === 'string'
      && typeof item.text === 'string'
      && typeof item.avatar === 'string'
      && typeof item.rating === 'number'
      && item.rating >= 1
      && item.rating <= 5,
    ) as FeedbackReview[]
  } catch {
    return []
  }
}

export const createFeedbackReview = (
  input: Pick<FeedbackReview, 'name' | 'role' | 'text' | 'rating'>,
): FeedbackReview => {
  const name = input.name.trim()
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name,
    role: input.role.trim(),
    text: input.text.trim(),
    rating: input.rating,
    avatar: toFeedbackAvatar(name) || 'TB',
  }
}

export const saveFeedbackReview = (review: FeedbackReview) => {
  if (typeof window === 'undefined') return

  const next = [review, ...loadFeedbackReviews()]
  window.localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(next))
}