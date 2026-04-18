import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { Search, MapPin, ArrowRight, Briefcase, Users, Building2, TrendingUp, Star, ChevronRight, Laptop2, Palette, Megaphone, WalletCards, HeartPulse, BarChart3, Cog, Rocket } from 'lucide-react'
import { useAppSelector } from '../../shared/hooks/redux'
import { Button } from '../../shared/components/ui'
import { cn, keepTextCharacters } from '../../shared/utils/helpers'
import toast from 'react-hot-toast'
import { FEEDBACK_STORAGE_KEY, loadFeedbackReviews, type FeedbackReview } from '../../shared/utils/feedback'

const FEATURED_CATEGORIES = [
  { label: 'Technology', Icon: Laptop2, count: '1.2k' },
  { label: 'Design', Icon: Palette, count: '340' },
  { label: 'Marketing', Icon: Megaphone, count: '580' },
  { label: 'Finance', Icon: WalletCards, count: '420' },
  { label: 'Healthcare', Icon: HeartPulse, count: '290' },
  { label: 'Data Science', Icon: BarChart3, count: '670' },
  { label: 'Engineering', Icon: Cog, count: '890' },
  { label: 'Sales', Icon: Rocket, count: '510' },
]

const INITIAL_REVIEWS: FeedbackReview[] = [
  { id: 'seed-1', name: 'Sarah Chen', role: 'Software Engineer at Google', text: 'Found my dream job in under 2 weeks. The filtering is incredible.', rating: 5, avatar: 'SC' },
  { id: 'seed-2', name: 'Marcus Reid', role: 'Product Designer at Stripe', text: 'Best job portal I\'ve used. Clean interface, great companies.', rating: 5, avatar: 'MR' },
  { id: 'seed-3', name: 'Priya Sharma', role: 'Data Scientist at Microsoft', text: 'Got 3 interview calls in my first week. Highly recommend!', rating: 5, avatar: 'PS' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAppSelector((s) => s.auth)
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')
  const [reviewWindowStart, setReviewWindowStart] = useState(0)
  const [feedbackForm, setFeedbackForm] = useState({
    name: '',
    role: '',
    text: '',
    rating: 5,
  })
  const [feedbackRatingHover, setFeedbackRatingHover] = useState<number | null>(null)
  const [feedbackErrors, setFeedbackErrors] = useState<{
    name?: string
    role?: string
    rating?: string
    text?: string
  }>({})
  const [userReviews, setUserReviews] = useState<FeedbackReview[]>(() => loadFeedbackReviews())

  const approvedReviews = useMemo(
    () => [...INITIAL_REVIEWS, ...userReviews].filter((review) => review.rating > 2),
    [userReviews],
  )

  const visibleReviews = useMemo(() => {
    if (approvedReviews.length <= 3) return approvedReviews
    const picks: FeedbackReview[] = []
    for (let i = 0; i < 3; i += 1) {
      picks.push(approvedReviews[(reviewWindowStart + i) % approvedReviews.length])
    }
    return picks
  }, [approvedReviews, reviewWindowStart])

  useEffect(() => {
    if (approvedReviews.length <= 3) {
      setReviewWindowStart(0)
      return undefined
    }

    const timer = window.setInterval(() => {
      setReviewWindowStart((current) => (current + 1) % approvedReviews.length)
    }, 5000)

    return () => window.clearInterval(timer)
  }, [approvedReviews.length])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!keyword.trim() && !location.trim()) {
      toast.error('Please enter a job title, keyword, or location to search')
      return
    }
    const params = new URLSearchParams()
    if (keyword) params.set('keyword', keyword)
    if (location) params.set('location', location)
    navigate(`/jobs?${params.toString()}`)
  }

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const name = feedbackForm.name.trim()
    const role = feedbackForm.role.trim()
    const text = feedbackForm.text.trim()
    const nextErrors: {
      name?: string
      role?: string
      rating?: string
      text?: string
    } = {}

    if (!name) {
      nextErrors.name = 'Name is required.'
    } else if (name.length < 2) {
      nextErrors.name = 'Name must be at least 2 characters.'
    }

    if (!role) {
      nextErrors.role = 'Role is required.'
    } else if (role.length < 2) {
      nextErrors.role = 'Role must be at least 2 characters.'
    }

    if (!Number.isInteger(feedbackForm.rating) || feedbackForm.rating < 1 || feedbackForm.rating > 5) {
      nextErrors.rating = 'Rating must be between 1 and 5.'
    }

    if (!text) {
      nextErrors.text = 'Feedback is required.'
    } else if (text.length < 10) {
      nextErrors.text = 'Feedback must be at least 10 characters.'
    }

    if (Object.keys(nextErrors).length > 0) {
      setFeedbackErrors(nextErrors)
      toast.error('Please correct the highlighted fields.')
      return
    }

    setFeedbackErrors({})

    const review: FeedbackReview = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      role,
      text,
      rating: feedbackForm.rating,
      avatar: name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('') || 'TB',
    }

    setUserReviews((prev) => {
      const next = [review, ...prev]
      window.localStorage.setItem(FEEDBACK_STORAGE_KEY, JSON.stringify(next))
      return next
    })

    setFeedbackForm({ name: '', role: '', text: '', rating: 5 })
    setFeedbackRatingHover(null)
    setFeedbackErrors({})
    toast.success('Thanks for sharing your feedback!')
  }

  const activeRating = feedbackRatingHover ?? feedbackForm.rating
  const ratingLabels: Record<number, string> = {
    1: 'Poor',
    2: 'Fair',
    3: 'Good',
    4: 'Very good',
    5: 'Excellent',
  }

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-slate-950 via-violet-950 to-slate-900 text-white py-24 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-mesh-gradient opacity-50" />
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-fuchsia-500/15 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2" />

        <div className="page-container relative">
          <div className="max-w-3xl mx-auto text-center animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-brand-500/20 border border-brand-500/30 rounded-full text-brand-300 text-body-sm font-medium mb-6">
              <TrendingUp className="w-4 h-4" />
              Over 10,000 active opportunities
            </div>
            <h1 className="font-display text-display-4xl font-bold leading-tight mb-6 text-balance">
              Find Your Next{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-brand-500">
                Dream Role
              </span>
            </h1>
            <p className="text-slate-400 mb-10 max-w-2xl mx-auto text-balance">
              Connect with top companies and opportunities that match your skills, experience and ambitions.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
              <div className="flex-1 flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-4 shadow-lg shadow-cyan-950/20">
                <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(keepTextCharacters(e.target.value))}
                  placeholder="Job title, keyword..."
                  className="flex-1 bg-transparent py-3.5 text-white placeholder-slate-400 outline-none text-body-sm"
                />
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/15 rounded-xl px-4 sm:w-48 shadow-lg shadow-cyan-950/20">
                <MapPin className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <input
                  value={location}
                  onChange={(e) => setLocation(keepTextCharacters(e.target.value))}
                  placeholder="Location"
                  className="flex-1 bg-transparent py-3.5 text-white placeholder-slate-400 outline-none text-body-sm"
                />
              </div>
              <Button type="submit" size="lg" className="px-6 py-3.5 text-body-sm whitespace-nowrap shadow-xl shadow-violet-950/20">
                Search Jobs <ArrowRight className="w-4 h-4" />
              </Button>
            </form>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-body-sm text-slate-500">
              <span>Popular:</span>
              {['React Developer', 'Product Manager', 'Data Engineer', 'UI/UX Designer'].map((q) => (
                <button
                  key={q}
                  onClick={() => navigate(`/jobs?keyword=${encodeURIComponent(q)}`)}
                  className="text-brand-400 hover:text-brand-300 hover:underline transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
        <div className="page-container py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { icon: Briefcase, value: '10K+', label: 'Active Jobs' },
              { icon: Building2, value: '5K+', label: 'Companies' },
              { icon: Users, value: '50K+', label: 'Candidates' },
              { icon: Star, value: '4.9', label: 'User Rating' },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex items-center justify-center gap-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 px-4 py-3">
                <Icon className="w-5 h-5 text-violet-500" />
                <div className="text-left">
                  <p className="font-display text-display-xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
                  <p className="text-body-xs text-slate-500">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-slate-50 dark:bg-slate-950">
        <div className="page-container">
          <div className="text-center mb-12">
            <h2 className="section-title mb-3">Browse by Category</h2>
            <p className="text-slate-500 max-w-lg mx-auto">Explore opportunities across every industry and specialty</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {FEATURED_CATEGORIES.map((cat, index) => (
              <button
                key={cat.label}
                onClick={() => navigate(`/jobs?category=${cat.label}`)}
                className="card-hover p-5 text-left group relative overflow-hidden"
              >
                <div className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r', index % 4 === 0 && 'from-violet-500 to-cyan-500', index % 4 === 1 && 'from-emerald-500 to-teal-500', index % 4 === 2 && 'from-amber-500 to-orange-500', index % 4 === 3 && 'from-rose-500 to-fuchsia-500')} />
                <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <cat.Icon className="h-5 w-5" />
                </div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-body-sm mb-1">{cat.label}</p>
                <p className="text-body-xs text-slate-500">{cat.count} jobs</p>
                <ChevronRight className="w-4 h-4 text-brand-500 mt-2 group-hover:translate-x-1 transition-transform" />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="page-container">
          <div className="text-center mb-12">
            <h2 className="section-title mb-3">How CareerBridge Works</h2>
            <p className="text-slate-500 max-w-lg mx-auto">Get hired in 3 simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Create Your Profile', desc: 'Sign up and build a compelling profile that showcases your skills and experience.', color: 'from-violet-500 to-fuchsia-600' },
              { step: '02', title: 'Discover Opportunities', desc: 'Browse thousands of jobs filtered by role, location, salary and experience level.', color: 'from-cyan-500 to-blue-600' },
              { step: '03', title: 'Apply & Get Hired', desc: 'Submit applications with your resume, track status, and land your dream job.', color: 'from-amber-500 to-orange-600' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-5 shadow-lg`}>
                  <span className="font-display text-display-xl font-bold text-white">{item.step}</span>
                </div>
                <h3 className="font-display text-display-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-slate-500 text-body-sm leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-b from-slate-100/80 via-slate-50 to-slate-100/60 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900/80">
        <div className="page-container">
          <div className="text-center mb-12">
            <h2 className="section-title mb-3">Loved by professionals</h2>
            <p className="text-slate-500 text-body-sm">Showing reviews with rating above 2 (max rating is 5)</p>
          </div>
          <form onSubmit={handleFeedbackSubmit} className="card p-6 md:p-7 mb-8 border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/90 shadow-xl shadow-slate-200/30 dark:shadow-black/20">
            <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h3 className="font-display text-display-lg font-semibold text-slate-900 dark:text-slate-100">Share your experience</h3>
                <p className="text-body-xs text-slate-500 dark:text-slate-400">Your review helps other professionals make better decisions.</p>
              </div>
              <p className="text-body-xs font-medium text-slate-500 dark:text-slate-400">Required fields are marked by validation.</p>
            </div>
            <div className="grid md:grid-cols-12 gap-4">
              <div className="md:col-span-3 space-y-1.5">
                <label htmlFor="feedback-name" className="label">Name</label>
                <input
                  id="feedback-name"
                  value={feedbackForm.name}
                  onChange={(e) => {
                    setFeedbackForm((prev) => ({ ...prev, name: e.target.value }))
                    setFeedbackErrors((prev) => ({ ...prev, name: undefined }))
                  }}
                  placeholder="e.g. Nikhil Kumar"
                  className={cn('input-field', feedbackErrors.name && 'input-error')}
                  maxLength={60}
                  aria-describedby={feedbackErrors.name ? 'feedback-name-error' : undefined}
                />
                {feedbackErrors.name && (
                  <p id="feedback-name-error" className="text-xs text-red-500">{feedbackErrors.name}</p>
                )}
              </div>

              <div className="md:col-span-4 space-y-1.5">
                <label htmlFor="feedback-role" className="label">Role</label>
                <input
                  id="feedback-role"
                  value={feedbackForm.role}
                  onChange={(e) => {
                    setFeedbackForm((prev) => ({ ...prev, role: e.target.value }))
                    setFeedbackErrors((prev) => ({ ...prev, role: undefined }))
                  }}
                  placeholder="e.g. Frontend Developer"
                  className={cn('input-field', feedbackErrors.role && 'input-error')}
                  maxLength={120}
                  aria-describedby={feedbackErrors.role ? 'feedback-role-error' : undefined}
                />
                {feedbackErrors.role && (
                  <p id="feedback-role-error" className="text-xs text-red-500">{feedbackErrors.role}</p>
                )}
              </div>

              <div className="md:col-span-5 space-y-1.5">
                <label className="label">Rating</label>
                <div className={cn('rounded-xl border px-3 py-3 bg-white dark:bg-slate-800', feedbackErrors.rating ? 'border-red-400' : 'border-slate-200 dark:border-slate-600')}>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((value) => {
                      const highlighted = value <= activeRating
                      return (
                        <button
                          key={value}
                          type="button"
                          onMouseEnter={() => setFeedbackRatingHover(value)}
                          onMouseLeave={() => setFeedbackRatingHover(null)}
                          onFocus={() => setFeedbackRatingHover(value)}
                          onBlur={() => setFeedbackRatingHover(null)}
                          onClick={() => {
                            setFeedbackForm((prev) => ({ ...prev, rating: value }))
                            setFeedbackErrors((prev) => ({ ...prev, rating: undefined }))
                          }}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors"
                          aria-label={`Rate ${value} out of 5`}
                        >
                          <Star className={cn('h-5 w-5', highlighted ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600')} />
                        </button>
                      )
                    })}
                  </div>
                  <p className="mt-1 text-body-xs text-slate-500 dark:text-slate-400">{activeRating} / 5 - {ratingLabels[activeRating]}</p>
                </div>
                {feedbackErrors.rating && (
                  <p id="feedback-rating-error" className="text-xs text-red-500">{feedbackErrors.rating}</p>
                )}
              </div>

              <div className="md:col-span-4 flex items-end">
                <Button type="submit" className="w-full justify-center">Submit Feedback</Button>
              </div>

              <div className="md:col-span-12 space-y-1.5">
                <label htmlFor="feedback-text" className="label">Feedback</label>
                <textarea
                  id="feedback-text"
                  value={feedbackForm.text}
                  onChange={(e) => {
                    setFeedbackForm((prev) => ({ ...prev, text: e.target.value }))
                    setFeedbackErrors((prev) => ({ ...prev, text: undefined }))
                  }}
                  placeholder="Tell us what worked well and what could be improved"
                  className={cn('input-field resize-none', feedbackErrors.text && 'input-error')}
                  rows={3}
                  maxLength={280}
                  aria-describedby={feedbackErrors.text ? 'feedback-text-error' : 'feedback-text-hint'}
                />
                {feedbackErrors.text ? (
                  <p id="feedback-text-error" className="text-xs text-red-500">{feedbackErrors.text}</p>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <p id="feedback-text-hint" className="text-xs text-slate-500 dark:text-slate-400">Minimum 10 characters. Maximum 280 characters.</p>
                    <p className={cn('text-xs font-medium', feedbackForm.text.length > 240 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400')}>
                      {feedbackForm.text.length}/280
                    </p>
                  </div>
                )}
              </div>
            </div>
          </form>
          <div className="grid md:grid-cols-3 gap-6">
            {visibleReviews.map((review) => (
              <div key={review.id} className="card p-6 border border-slate-200/70 dark:border-slate-800 border-t-4 border-t-violet-500">
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
                    />
                  ))}
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-body-sm leading-relaxed mb-5">"{review.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white text-sm font-bold">
                    {review.avatar}
                  </div>
                  <div>
                    <p className="text-body-sm font-semibold text-slate-900 dark:text-slate-100">{review.name}</p>
                    <p className="text-body-xs text-slate-500">{review.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      {!isAuthenticated && (
        <section className="py-20 bg-gradient-to-r from-brand-600 to-brand-700">
          <div className="page-container text-center">
            <h2 className="font-display text-display-3xl font-bold text-white mb-4">
              Ready to find your next opportunity?
            </h2>
            <p className="text-brand-100 mb-8 max-w-lg mx-auto">
              Join thousands of professionals who found their dream job on CareerBridge.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Link to="/register" className="btn-primary !bg-white !text-violet-700 hover:!bg-violet-50 py-3 px-8 text-base">
                Get Started Free
              </Link>
              <Link to="/jobs" className="btn-ghost !text-white hover:!bg-white/10 py-3 px-8 text-base border border-white/20">
                Browse Jobs
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
