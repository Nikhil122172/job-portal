import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { applicationsApi, jobsApi, type ApplicationResponse, type JobResponse } from '../../core/api/services'
import { EmptyState, PageSpinner, StatsCard } from '../../shared/components/ui'
import { cn, timeAgo } from '../../shared/utils/helpers'
import { Briefcase, CalendarRange, ClipboardList, FileText, TrendingUp, Users } from 'lucide-react'
import toast from 'react-hot-toast'

interface JobStats {
  totalJobs?: number
  activeJobs?: number
  closedJobs?: number
  draftJobs?: number
}

interface RecruiterState {
  totalJobs: number
  activeJobs: number
  draftJobs: number
  totalApplications: number
  jobs: JobResponse[]
  applications: ApplicationResponse[]
}

function getList<T>(payload: unknown): T[] {
  const page = payload as { content?: T[] } | undefined
  return Array.isArray(page?.content) ? page.content : []
}

function getTotal(payload: unknown): number {
  const page = payload as { totalElements?: number; content?: unknown[] } | undefined
  if (typeof page?.totalElements === 'number') return page.totalElements
  return Array.isArray(page?.content) ? page.content.length : 0
}

export default function RecruiterDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [state, setState] = useState<RecruiterState>({
    totalJobs: 0,
    activeJobs: 0,
    draftJobs: 0,
    totalApplications: 0,
    jobs: [],
    applications: [],
  })

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [jobsRes, statsRes, inboxRes] = await Promise.allSettled([
          jobsApi.getMyJobs(0, 5),
          jobsApi.getStats(),
          applicationsApi.getRecruiterInbox(0, 5),
        ])

        if (!active) return

        const jobPage = jobsRes.status === 'fulfilled' ? jobsRes.value.data : undefined
        const stats = statsRes.status === 'fulfilled' ? (statsRes.value.data as JobStats) : {}
        const inboxPage = inboxRes.status === 'fulfilled' ? inboxRes.value.data : undefined

        setState({
          totalJobs: stats.totalJobs ?? 0,
          activeJobs: stats.activeJobs ?? 0,
          draftJobs: stats.draftJobs ?? 0,
          totalApplications: getTotal(inboxPage),
          jobs: getList<JobResponse>(jobPage),
          applications: getList<ApplicationResponse>(inboxPage),
        })
      } catch (loadError) {
        if (!active) return
        setError('Failed to load recruiter dashboard data.')
        toast.error('Unable to load recruiter dashboard data. Please try again.')
        console.error(loadError)
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [])

  if (loading) return <PageSpinner />

  return (
    <div className="py-10">
      <div className="page-container max-w-6xl space-y-8">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-950 via-slate-900 to-teal-950 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_32%)]" />
          <div className="relative p-8 md:p-10 lg:p-12">
            <h1 className="font-display text-display-3xl md:text-display-4xl font-bold tracking-tight mb-4">Recruiter workspace</h1>
            <p className="max-w-2xl text-white/80 text-body-sm md:text-body leading-relaxed">
              Track open roles, monitor applicant flow, and move hiring faster.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/recruiter/post-job" className="btn-primary bg-white text-emerald-700 hover:bg-emerald-50 px-5 py-3 text-sm inline-flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Post a Job
              </Link>
              <Link to="/recruiter/jobs" className="btn-ghost border border-white/20 text-white hover:bg-white/10 px-5 py-3 text-sm inline-flex items-center gap-2">
                <ClipboardList className="w-4 h-4" /> My Jobs
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
          <StatsCard label="Total Jobs" value={state.totalJobs} icon={<Briefcase className="w-5 h-5" />} color="green" />
          <StatsCard label="Active Jobs" value={state.activeJobs} icon={<TrendingUp className="w-5 h-5" />} color="blue" />
          <StatsCard label="Inbox Applications" value={state.totalApplications} icon={<FileText className="w-5 h-5" />} color="purple" />
          <StatsCard label="Draft Jobs" value={state.draftJobs} icon={<CalendarRange className="w-5 h-5" />} color="orange" />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <h2 className="font-display text-display-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Recent jobs</h2>
            {state.jobs.length ? (
              <div className="space-y-3">
                {state.jobs.map((job) => (
                  <div key={job.id} className="rounded-2xl border border-slate-100 dark:border-slate-800 p-3">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{job.title}</p>
                    <p className="text-sm text-slate-500 truncate">{job.company} {job.location ? `- ${job.location}` : ''}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                      <span className="badge-slate">{job.status}</span>
                      <span>{job.applicationsCount ?? 0} applications</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No jobs yet" description="Create your first job posting to start hiring." icon={<Briefcase className="w-8 h-8" />} />
            )}
          </div>

          <div className="card p-6">
            <h2 className="font-display text-display-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Recent applicants</h2>
            {state.applications.length ? (
              <div className="space-y-3">
                {state.applications.map((application) => (
                  <div key={application.id} className="rounded-2xl border border-slate-100 dark:border-slate-800 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-slate-100">{application.applicantName}</p>
                        <p className="text-xs text-slate-500">{application.jobTitle}</p>
                      </div>
                      <span className={cn('badge text-xs', application.status === 'SHORTLISTED' ? 'badge-green' : application.status === 'REJECTED' ? 'badge-red' : 'badge-blue')}>
                        {application.status?.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {timeAgo(application.appliedAt)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No applicants yet" description="Applicants will show up here once people apply." icon={<Users className="w-8 h-8" />} />
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
