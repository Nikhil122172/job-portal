import { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../shared/hooks/redux'
import { searchJobsThunk, getCategoriesThunk } from '../../store/slices/jobsSlice'
import { Search, MapPin, Filter, X, Briefcase, Clock, DollarSign, Wifi, ChevronDown } from 'lucide-react'
import { cn, formatSalary, timeAgo, JOB_TYPE_LABELS, EXP_LEVEL_LABELS, keepTextCharacters } from '../../shared/utils/helpers'
import { Pagination, EmptyState, Skeleton } from '../../shared/components/ui'
import { Link } from 'react-router-dom'
import type { JobResponse } from '../../core/api/services'

const JOB_TYPES = Object.entries(JOB_TYPE_LABELS).map(([value, label]) => ({ value, label }))
const EXP_LEVELS = Object.entries(EXP_LEVEL_LABELS).map(([value, label]) => ({ value, label }))

/** Returns undefined for blank/empty strings so the API ignores the param. */
function toParam(value: string): string | undefined {
  const v = value.trim()
  return v.length > 0 ? v : undefined
}

function JobCard({ job }: { job: JobResponse }) {
  return (
    <Link
      to={`/jobs/${job.id}`}
      className="card-hover group relative overflow-hidden p-5 block animate-fade-in"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-cyan-500 to-indigo-500 opacity-80" />
      <div className="absolute -right-10 -top-10 h-24 w-24 rounded-full bg-brand-500/10 blur-2xl transition-opacity group-hover:opacity-100 opacity-70" />

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-display-lg font-semibold text-slate-900 dark:text-slate-100 leading-snug mb-1 truncate">
            {job.title}
          </h3>
          <p className="text-sm text-slate-500 font-medium">{job.company}</p>
        </div>
        {job.isRemote && (
          <span className="badge-blue flex items-center gap-1 flex-shrink-0">
            <Wifi className="w-3 h-3" /> Remote
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs text-slate-500 mb-4">
        <span className="flex items-center gap-1 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 px-2.5 py-2">
          <MapPin className="w-3 h-3 text-brand-500" />{job.location}
        </span>
        <span className="flex items-center gap-1 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 px-2.5 py-2">
          <Briefcase className="w-3 h-3 text-cyan-500" />{JOB_TYPE_LABELS[job.jobType] || job.jobType}
        </span>
        {(job.salaryMin || job.salaryMax) && (
          <span className="flex items-center gap-1 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 px-2.5 py-2 col-span-2">
            <DollarSign className="w-3 h-3 text-emerald-500" />{formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
          </span>
        )}
        <span className="flex items-center gap-1 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 px-2.5 py-2 col-span-2">
          <Clock className="w-3 h-3 text-amber-500" />{timeAgo(job.createdAt)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {job.category && <span className="badge-slate">{job.category}</span>}
          <span className="badge-blue">{EXP_LEVEL_LABELS[job.experienceLevel] || job.experienceLevel}</span>
        </div>
        <span className="text-xs font-medium text-slate-500 bg-white/70 dark:bg-slate-800/70 px-2.5 py-1.5 rounded-full border border-slate-100 dark:border-slate-700">
          {job.applicationsCount} applied
        </span>
      </div>
    </Link>
  )
}

function SkeletonCard() {
  return (
    <div className="card p-5 space-y-3">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex gap-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-20" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
    </div>
  )
}

export default function JobsPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { jobs, totalPages, totalElements, loading, categories } = useAppSelector((s) => s.jobs)

  // ── Input state (controls what the user sees in the text boxes) ───────────
  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '')
  const [location, setLocation] = useState(searchParams.get('location') || '')

  // ── Debounced state (what actually triggers the API call) ─────────────────
  // These lag behind the input state by 400 ms while the user is still typing.
  const [debouncedKeyword, setDebouncedKeyword] = useState(keyword)
  const [debouncedLocation, setDebouncedLocation] = useState(location)

  // ── Instant-apply filter state (dropdowns & toggle) ───────────────────────
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [jobType, setJobType] = useState('')
  const [experienceLevel, setExpLevel] = useState('')
  const [isRemote, setIsRemote] = useState(false)
  const [page, setPage] = useState(0)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load categories once on mount
  useEffect(() => {
    dispatch(getCategoriesThunk())
  }, [dispatch])

  // ── Debounce keyword input ────────────────────────────────────────────────
  // Update debouncedKeyword 400 ms after the user stops typing.
  // The search effect below depends on debouncedKeyword, not keyword,
  // so no API call fires until the user pauses.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedKeyword(keyword)
      setPage(0)
    }, 400)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [keyword])

  // ── Debounce location input ───────────────────────────────────────────────
  const locationDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current)
    locationDebounceRef.current = setTimeout(() => {
      setDebouncedLocation(location)
      setPage(0)
    }, 400)
    return () => { if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current) }
  }, [location])

  // ── Single unified search effect ──────────────────────────────────────────
  // Depends on debouncedKeyword / debouncedLocation (not the raw input values)
  // so text input changes are rate-limited.
  // Depends on category / jobType / experienceLevel / isRemote directly
  // because dropdowns and toggles should apply instantly (no debounce needed).
  // Runs on mount to load all jobs when user clicks Jobs in the navbar.
  useEffect(() => {
    dispatch(
      searchJobsThunk({
        keyword: toParam(debouncedKeyword),
        location: toParam(debouncedLocation),
        category: toParam(category),
        jobType: toParam(jobType),
        experienceLevel: toParam(experienceLevel),
        isRemote: isRemote || undefined,
        page,
        size: 12,
      }),
    )
  }, [dispatch, debouncedKeyword, debouncedLocation, category, jobType, experienceLevel, isRemote, page])

  useEffect(() => {
    const nextParams = new URLSearchParams()
    if (keyword.trim()) nextParams.set('keyword', keyword.trim())
    if (location.trim()) nextParams.set('location', location.trim())
    if (category) nextParams.set('category', category)
    if (jobType) nextParams.set('jobType', jobType)
    if (experienceLevel) nextParams.set('experienceLevel', experienceLevel)
    if (isRemote) nextParams.set('isRemote', 'true')
    if (page > 0) nextParams.set('page', String(page))
    setSearchParams(nextParams, { replace: true })
  }, [keyword, location, category, jobType, experienceLevel, isRemote, page, setSearchParams])

  const clearFilters = () => {
    setCategory(''); setJobType(''); setExpLevel(''); setIsRemote(false)
    setKeyword(''); setLocation('')
    setDebouncedKeyword(''); setDebouncedLocation('')
    setPage(0)
    navigate('/jobs', { replace: true })
  }

  const hasFilters = category || jobType || experienceLevel || isRemote

  return (
    <div className="py-8">
      <div className="page-container">
        {/* Search bar */}
        <div className="card p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-xl px-4">
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                value={keyword}
                onChange={(e) => setKeyword(keepTextCharacters(e.target.value))}
                placeholder="Job title, skills, company..."
                className="flex-1 bg-transparent py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none"
              />
              {keyword && (
                <button
                  type="button"
                  title="Clear keyword"
                  aria-label="Clear keyword"
                  onClick={() => { setKeyword(''); setDebouncedKeyword(''); setPage(0) }}
                >
                  <X className="w-4 h-4 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 sm:w-48">
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <input
                value={location}
                onChange={(e) => setLocation(keepTextCharacters(e.target.value))}
                placeholder="City or remote"
                className="flex-1 bg-transparent py-3 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none"
              />
            </div>
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className={cn('btn-secondary flex items-center gap-2 px-4', hasFilters && 'border-brand-400 text-brand-600')}
            >
              <Filter className="w-4 h-4" />
              Filters
              {hasFilters && <span className="w-2 h-2 bg-brand-500 rounded-full" />}
              <ChevronDown className={cn('w-3 h-3 transition-transform', filtersOpen && 'rotate-180')} />
            </button>
          </div>

          {filtersOpen && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-slide-down">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="label">Category</label>
                  <select
                    title="Category"
                    aria-label="Category"
                    value={category}
                    onChange={(e) => { setCategory(e.target.value); setPage(0) }}
                    className="input-field bg-white dark:bg-slate-800 text-body-sm"
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Job Type</label>
                  <select
                    title="Job Type"
                    aria-label="Job Type"
                    value={jobType}
                    onChange={(e) => { setJobType(e.target.value); setPage(0) }}
                    className="input-field bg-white dark:bg-slate-800 text-body-sm"
                  >
                    <option value="">All Types</option>
                    {JOB_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Experience</label>
                  <select
                    title="Experience"
                    aria-label="Experience"
                    value={experienceLevel}
                    onChange={(e) => { setExpLevel(e.target.value); setPage(0) }}
                    className="input-field bg-white dark:bg-slate-800 text-body-sm"
                  >
                    <option value="">All Levels</option>
                    {EXP_LEVELS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2.5 cursor-pointer mb-2">
                    <div
                      onClick={() => { setIsRemote(!isRemote); setPage(0) }}
                      className={cn('w-10 h-6 rounded-full transition-colors relative', isRemote ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-700')}
                    >
                      <div className={cn('absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform', isRemote ? 'translate-x-5' : 'translate-x-1')} />
                    </div>
                    <span className="text-sm text-slate-700 dark:text-slate-300">Remote only</span>
                  </label>
                </div>
              </div>
              {hasFilters && (
                <button onClick={clearFilters} className="mt-3 text-sm text-red-500 hover:text-red-700 flex items-center gap-1">
                  <X className="w-3 h-3" /> Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-body-sm text-slate-500">
            {loading ? 'Searching...' : <><span className="font-semibold text-slate-900 dark:text-slate-100">{totalElements.toLocaleString()}</span> jobs found</>}
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : jobs.length === 0
              ? <div className="col-span-full"><EmptyState title="No jobs found" description="Try adjusting your search or filters" icon={<Briefcase className="w-12 h-12" />} /></div>
              : jobs.map((job) => <JobCard key={job.id} job={job} />)
          }
        </div>

        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  )
}
