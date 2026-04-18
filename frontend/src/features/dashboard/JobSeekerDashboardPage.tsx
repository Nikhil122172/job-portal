import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { applicationsApi, jobsApi, type ApplicationResponse, type JobResponse, type UserResponse } from '../../core/api/services'
import { EmptyState, PageSpinner, StatsCard } from '../../shared/components/ui'
import { useAppSelector } from '../../shared/hooks/redux'
import { cn, timeAgo } from '../../shared/utils/helpers'
import { BadgeCheck, Briefcase, ClipboardList, MapPin, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

interface ApplicationStats {
  totalApplications?: number
  applied?: number
  underReview?: number
  shortlisted?: number
  rejected?: number
  offered?: number
}

interface SeekerState {
  totalApplications: number
  shortlisted: number
  offered: number
  profileCompletion: number
  applications: ApplicationResponse[]
  recommendedJobs: JobResponse[]
}

function getList<T>(payload: unknown): T[] {
  const page = payload as { content?: T[] } | undefined
  return Array.isArray(page?.content) ? page.content : []
}

function getProfileCompletion(user: UserResponse | null): number {
  if (!user) return 0
  const fields = [user.profileImageUrl, user.phoneNumber, user.bio, user.location]
  const filled = fields.filter(Boolean).length
  return Math.round((filled / fields.length) * 100)
}

export default function JobSeekerDashboardPage() {
  const { user } = useAppSelector((s) => s.auth)
  const currentUser = user as UserResponse | null

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [state, setState] = useState<SeekerState>({
    totalApplications: 0,
    shortlisted: 0,
    offered: 0,
    profileCompletion: getProfileCompletion(currentUser),
    applications: [],
    recommendedJobs: [],
  })

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const [statsRes, appsRes, jobsRes] = await Promise.allSettled([
          applicationsApi.getMyStats(),
          applicationsApi.getMyApplications(0, 5),
          jobsApi.search({ page: 0, size: 4, sortBy: 'createdAt' }),
        ])

        if (!active) return

        const stats = statsRes.status === 'fulfilled' ? (statsRes.value.data as ApplicationStats) : {}
        const appsPage = appsRes.status === 'fulfilled' ? appsRes.value.data : undefined
        const jobsPage = jobsRes.status === 'fulfilled' ? jobsRes.value.data : undefined

        setState({
          totalApplications: stats.totalApplications ?? 0,
          shortlisted: stats.shortlisted ?? 0,
          offered: stats.offered ?? 0,
          profileCompletion: getProfileCompletion(currentUser),
          applications: getList<ApplicationResponse>(appsPage),
          recommendedJobs: getList<JobResponse>(jobsPage),
        })
      } catch (loadError) {
        if (!active) return
        setError('Failed to load dashboard data.')
        toast.error('Unable to load dashboard data. Please try again.')
        console.error(loadError)
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [currentUser])

  if (loading) return <PageSpinner />

  return (
    <div className="py-10">
      <div className="page-container max-w-6xl space-y-8">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-blue-950 via-slate-900 to-cyan-950 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_32%)]" />
          <div className="relative p-8 md:p-10 lg:p-12">
            <h1 className="font-display text-display-3xl md:text-display-4xl font-bold tracking-tight mb-4">Career dashboard</h1>
            <p className="max-w-2xl text-white/80 text-body-sm md:text-body leading-relaxed">
              Follow your application journey, discover jobs, and keep your profile strong.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/jobs" className="btn-primary bg-white text-blue-700 hover:bg-blue-50 px-5 py-3 text-sm inline-flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Browse Jobs
              </Link>
              <Link to="/applications" className="btn-ghost border border-white/20 text-white hover:bg-white/10 px-5 py-3 text-sm inline-flex items-center gap-2">
                <ClipboardList className="w-4 h-4" /> My Applications
              </Link>
            </div>
          </div>
        </section>

        {error && (
          <div className="card border-red-200 bg-red-50/60 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-300">
            {error}
          </div>
        )}

        <section className="grid gap-4 lg:grid-cols-4">
          <StatsCard label="Applications" value={state.totalApplications} icon={<ClipboardList className="w-5 h-5" />} color="blue" />
          <StatsCard label="Shortlisted" value={state.shortlisted} icon={<BadgeCheck className="w-5 h-5" />} color="green" />
          <StatsCard label="Offered" value={state.offered} icon={<Sparkles className="w-5 h-5" />} color="purple" />
          <StatsCard label="Profile Completion" value={`${state.profileCompletion}%`} icon={<MapPin className="w-5 h-5" />} color="orange" />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <h2 className="font-display text-display-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Recent applications</h2>
            {state.applications.length ? (
              <div className="space-y-3">
                {state.applications.map((application) => (
                  <div key={application.id} className="rounded-2xl border border-slate-100 dark:border-slate-800 p-3">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{application.jobTitle}</p>
                    <p className="text-xs text-slate-500">{application.companyName}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                      <span className={cn('badge text-xs', application.status === 'SHORTLISTED' ? 'badge-green' : application.status === 'REJECTED' ? 'badge-red' : 'badge-blue')}>
                        {application.status?.replace('_', ' ')}
                      </span>
                      <span>{timeAgo(application.appliedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No applications yet" description="Apply to jobs and track updates here." icon={<ClipboardList className="w-8 h-8" />} />
            )}
          </div>

          <div className="card p-6">
            <h2 className="font-display text-display-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Recommended jobs</h2>
            {state.recommendedJobs.length ? (
              <div className="space-y-3">
                {state.recommendedJobs.map((job) => (
                  <Link key={job.id} to={`/jobs/${job.id}`} className="block rounded-2xl border border-slate-100 dark:border-slate-800 p-3 hover:border-brand-300 transition-colors">
                    <p className="font-medium text-slate-900 dark:text-slate-100 line-clamp-2">{job.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{job.company}</p>
                    <p className="text-xs text-slate-400 mt-2">{job.location}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState title="No recommendations yet" description="Newly posted jobs will appear here." icon={<Briefcase className="w-8 h-8" />} />
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
