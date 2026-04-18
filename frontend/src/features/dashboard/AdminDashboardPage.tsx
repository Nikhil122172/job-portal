import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi, applicationsApi, authApi, type ApplicationResponse } from '../../core/api/services'
import { Avatar, EmptyState, PageSpinner, StatsCard } from '../../shared/components/ui'
import { timeAgo, cn } from '../../shared/utils/helpers'
import { Briefcase, FileText, ShieldCheck, TrendingUp, Users } from 'lucide-react'
import toast from 'react-hot-toast'

interface UserItem {
  id: number
  fullName: string
  email: string
  role: string
  isActive: boolean
  profileImageUrl?: string
  createdAt: string
}

interface AdminMetrics {
  totalUsers: number
  totalJobs: number
  totalApplications: number
  activeJobs: number
}

interface AdminState {
  metrics: AdminMetrics
  recentUsers: UserItem[]
  recentApplications: ApplicationResponse[]
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

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [state, setState] = useState<AdminState>({
    metrics: { totalUsers: 0, totalJobs: 0, totalApplications: 0, activeJobs: 0 },
    recentUsers: [],
    recentApplications: [],
  })

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const [analyticsRes, usersRes, appsRes] = await Promise.allSettled([
          adminApi.getAnalytics(),
          authApi.getAllUsers(0, 5),
          applicationsApi.getAllApplications(0, 5),
        ])

        if (!active) return

        const analytics = analyticsRes.status === 'fulfilled'
          ? (analyticsRes.value.data as Partial<AdminMetrics>)
          : {}
        const usersPage = usersRes.status === 'fulfilled' ? usersRes.value.data : undefined
        const appsPage = appsRes.status === 'fulfilled' ? appsRes.value.data : undefined

        setState({
          metrics: {
            totalUsers: analytics.totalUsers ?? getTotal(usersPage),
            totalJobs: analytics.totalJobs ?? 0,
            totalApplications: analytics.totalApplications ?? getTotal(appsPage),
            activeJobs: analytics.activeJobs ?? 0,
          },
          recentUsers: getList<UserItem>(usersPage),
          recentApplications: getList<ApplicationResponse>(appsPage),
        })
      } catch (loadError) {
        if (!active) return
        setError('Failed to load admin dashboard data.')
        toast.error('Unable to load admin dashboard data. Please try again.')
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
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.08),transparent_32%)]" />
          <div className="relative p-8 md:p-10 lg:p-12">
            <div className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium mb-5 bg-indigo-500/15 text-indigo-200 border-indigo-400/30">
              <ShieldCheck className="w-4 h-4" />
              ADMIN dashboard
            </div>
            <h1 className="font-display text-display-3xl md:text-display-4xl font-bold tracking-tight mb-4">Platform command center</h1>
            <p className="max-w-2xl text-white/80 text-body-sm md:text-body leading-relaxed">
              Monitor users, jobs, and applications from one central admin view.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/admin" className="btn-primary bg-white text-violet-700 hover:bg-violet-50 px-5 py-3 text-sm inline-flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Open Admin Panel
              </Link>
              <Link to="/jobs" className="btn-ghost border border-white/20 text-white hover:bg-white/10 px-5 py-3 text-sm inline-flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Review Jobs
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
          <StatsCard label="Total Users" value={state.metrics.totalUsers} icon={<Users className="w-5 h-5" />} color="blue" />
          <StatsCard label="Total Jobs" value={state.metrics.totalJobs} icon={<Briefcase className="w-5 h-5" />} color="green" />
          <StatsCard label="Applications" value={state.metrics.totalApplications} icon={<FileText className="w-5 h-5" />} color="purple" />
          <StatsCard label="Active Jobs" value={state.metrics.activeJobs} icon={<TrendingUp className="w-5 h-5" />} color="orange" />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <h2 className="font-display text-display-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Recent users</h2>
            {state.recentUsers.length ? (
              <div className="space-y-3">
                {state.recentUsers.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 dark:border-slate-800 p-3">
                    <Avatar name={item.fullName} src={item.profileImageUrl} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{item.fullName}</p>
                      <p className="text-xs text-slate-500 truncate">{item.role.replace('ROLE_', '').replace('_', ' ')}</p>
                    </div>
                    <span className={cn('badge text-xs', item.isActive ? 'badge-green' : 'badge-red')}>
                      {item.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No users yet" description="Recent user activity will appear here." icon={<Users className="w-8 h-8" />} />
            )}
          </div>

          <div className="card p-6">
            <h2 className="font-display text-display-xl font-semibold text-slate-900 dark:text-slate-100 mb-4">Recent applications</h2>
            {state.recentApplications.length ? (
              <div className="space-y-3">
                {state.recentApplications.map((application) => (
                  <div key={application.id} className="rounded-2xl border border-slate-100 dark:border-slate-800 p-3">
                    <p className="font-medium text-slate-900 dark:text-slate-100">{application.jobTitle}</p>
                    <p className="text-xs text-slate-500">{application.companyName}</p>
                    <p className="text-xs text-slate-400 mt-1">{timeAgo(application.appliedAt)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No applications yet" description="Recent application activity will appear here." icon={<FileText className="w-8 h-8" />} />
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
