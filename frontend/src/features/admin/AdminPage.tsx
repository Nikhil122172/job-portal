import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { adminApi, authApi, jobsApi, type ApplicationResponse, type JobResponse } from '../../core/api/services'
import { Users, Briefcase, FileText, TrendingUp, RefreshCw, Shield, ToggleLeft, Trash2 } from 'lucide-react'
import { PageSpinner, StatsCard, Avatar, Modal, Spinner, Pagination } from '../../shared/components/ui'
import { timeAgo, cn } from '../../shared/utils/helpers'
import toast from 'react-hot-toast'

interface Analytics {
  totalUsers?: number
  totalJobs?: number
  totalApplications?: number
  activeJobs?: number
  jobSeekers?: number
  recruiters?: number
}

interface UserItem {
  id: number
  fullName: string
  email: string
  role: string
  isActive: boolean
  profileImageUrl?: string
  createdAt: string
}

type JobStatus = 'ACTIVE' | 'DRAFT' | 'CLOSED' | 'EXPIRED'

const JOB_STATUS_OPTIONS: Array<{ label: string; value: JobStatus }> = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Closed', value: 'CLOSED' },
  { label: 'Expired', value: 'EXPIRED' },
]

function escapeCsv(value: unknown): string {
  const text = String(value ?? '')
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

function downloadCsv(filename: string, headers: string[], rows: unknown[][]) {
  const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function normalizeFilterText(value: string) {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function parsePage(value: string | null) {
  const page = Number(value)
  return Number.isFinite(page) && page >= 0 ? page : 0
}

function parseTab(value: string | null): 'overview' | 'users' | 'jobs' | 'applications' {
  if (value === 'users' || value === 'jobs' || value === 'applications') return value
  return 'overview'
}

function parseUserRole(value: string | null): 'ALL' | 'ADMIN' | 'RECRUITER' | 'JOB_SEEKER' {
  if (value === 'ADMIN' || value === 'RECRUITER' || value === 'JOB_SEEKER') return value
  return 'ALL'
}

function parseUserStatus(value: string | null): 'ALL' | 'ACTIVE' | 'INACTIVE' {
  if (value === 'ACTIVE' || value === 'INACTIVE') return value
  return 'ALL'
}

function parseJobStatus(value: string | null): 'ALL' | 'ACTIVE' | 'DRAFT' | 'CLOSED' {
  if (value === 'ACTIVE' || value === 'DRAFT' || value === 'CLOSED') return value
  return 'ALL'
}

function parseApplicationStatus(value: string | null): 'ALL' | 'UNDER_REVIEW' | 'SHORTLISTED' | 'REJECTED' | 'OFFERED' | 'APPLIED' {
  if (value === 'UNDER_REVIEW' || value === 'SHORTLISTED' || value === 'REJECTED' || value === 'OFFERED' || value === 'APPLIED') return value
  return 'ALL'
}

export default function AdminPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [users, setUsers] = useState<UserItem[]>([])
  const [jobs, setJobs] = useState<JobResponse[]>([])
  const [applications, setApplications] = useState<ApplicationResponse[]>([])
  const [loadingData, setLoadingData] = useState(true)
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'jobs' | 'applications'>(() => parseTab(searchParams.get('tab')))
  const [page, setPage] = useState(() => parsePage(searchParams.get('page')))
  const [jobPage, setJobPage] = useState(() => parsePage(searchParams.get('jobPage')))
  const [applicationPage, setApplicationPage] = useState(() => parsePage(searchParams.get('applicationPage')))
  const [totalPages, setTotalPages] = useState(0)
  const [jobTotalPages, setJobTotalPages] = useState(0)
  const [applicationTotalPages, setApplicationTotalPages] = useState(0)
  const [totalUsers, setTotalUsers] = useState(0)
  const [totalJobs, setTotalJobs] = useState(0)
  const [totalApplications, setTotalApplications] = useState(0)
  const [deleteConfirm, setDeleteConfirm] = useState<UserItem | null>(null)
  const [deleteJobConfirm, setDeleteJobConfirm] = useState<JobResponse | null>(null)
  const [toggling, setToggling] = useState<number | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deletingJob, setDeletingJob] = useState(false)
  const [bulkDeactivatingUsers, setBulkDeactivatingUsers] = useState(false)
  const [bulkDeletingJobs, setBulkDeletingJobs] = useState(false)
  const [bulkUpdatingJobStatus, setBulkUpdatingJobStatus] = useState(false)
  const [selectingAllUsers, setSelectingAllUsers] = useState(false)
  const [selectingAllJobs, setSelectingAllJobs] = useState(false)
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([])
  const [selectedJobIds, setSelectedJobIds] = useState<number[]>([])
  const [jobBulkStatus, setJobBulkStatus] = useState<JobStatus>('ACTIVE')
  const [bulkActionConfirm, setBulkActionConfirm] = useState<{
    kind: 'status' | 'delete'
    count: number
    status?: JobStatus
  } | null>(null)
  const [userQuery, setUserQuery] = useState(() => searchParams.get('userQuery') || '')
  const [userRoleFilter, setUserRoleFilter] = useState<'ALL' | 'ADMIN' | 'RECRUITER' | 'JOB_SEEKER'>(() => parseUserRole(searchParams.get('userRole')))
  const [userStatusFilter, setUserStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>(() => parseUserStatus(searchParams.get('userStatus')))
  const [jobQuery, setJobQuery] = useState(() => searchParams.get('jobQuery') || '')
  const [jobStatusFilter, setJobStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DRAFT' | 'CLOSED'>(() => parseJobStatus(searchParams.get('jobStatus')))
  const [applicationQuery, setApplicationQuery] = useState(() => searchParams.get('applicationQuery') || '')
  const [applicationStatusFilter, setApplicationStatusFilter] = useState<'ALL' | 'UNDER_REVIEW' | 'SHORTLISTED' | 'REJECTED' | 'OFFERED' | 'APPLIED'>(() => parseApplicationStatus(searchParams.get('applicationStatus')))
  const pageSize = 20
  const jobPageSize = 10
  const applicationPageSize = 10

  useEffect(() => { setPage(0) }, [userQuery, userRoleFilter, userStatusFilter])
  useEffect(() => { setJobPage(0) }, [jobQuery, jobStatusFilter])
  useEffect(() => { setApplicationPage(0) }, [applicationQuery, applicationStatusFilter])

  useEffect(() => {
    const nextParams = new URLSearchParams()
    if (activeTab !== 'overview') nextParams.set('tab', activeTab)
    if (page > 0) nextParams.set('page', String(page))
    if (jobPage > 0) nextParams.set('jobPage', String(jobPage))
    if (applicationPage > 0) nextParams.set('applicationPage', String(applicationPage))
    if (userQuery.trim()) nextParams.set('userQuery', userQuery.trim())
    if (userRoleFilter !== 'ALL') nextParams.set('userRole', userRoleFilter)
    if (userStatusFilter !== 'ALL') nextParams.set('userStatus', userStatusFilter)
    if (jobQuery.trim()) nextParams.set('jobQuery', jobQuery.trim())
    if (jobStatusFilter !== 'ALL') nextParams.set('jobStatus', jobStatusFilter)
    if (applicationQuery.trim()) nextParams.set('applicationQuery', applicationQuery.trim())
    if (applicationStatusFilter !== 'ALL') nextParams.set('applicationStatus', applicationStatusFilter)
    setSearchParams(nextParams, { replace: true })
  }, [activeTab, page, jobPage, applicationPage, userQuery, userRoleFilter, userStatusFilter, jobQuery, jobStatusFilter, applicationQuery, applicationStatusFilter, setSearchParams])

  const visibleUserIds = users.map((user) => user.id)
  const visibleJobIds = jobs.map((job) => job.id)
  const allVisibleUsersSelected = visibleUserIds.length > 0 && visibleUserIds.every((id) => selectedUserIds.includes(id))
  const allVisibleJobsSelected = visibleJobIds.length > 0 && visibleJobIds.every((id) => selectedJobIds.includes(id))

  const selectedUsersCount = selectedUserIds.length
  const selectedJobsCount = selectedJobIds.length

  const loadData = async () => {
    setLoadingData(true)
    try {
      const [analyticsRes, usersRes, jobsRes, applicationsRes] = await Promise.allSettled([
        adminApi.getAnalytics(),
        adminApi.getUsers({
          keyword: normalizeFilterText(userQuery),
          role: userRoleFilter === 'ALL' ? undefined : userRoleFilter,
          isActive: userStatusFilter === 'ALL' ? undefined : userStatusFilter === 'ACTIVE',
          page,
          size: pageSize,
        }),
        adminApi.getJobs({
          keyword: normalizeFilterText(jobQuery),
          status: jobStatusFilter === 'ALL' ? undefined : jobStatusFilter,
          page: jobPage,
          size: jobPageSize,
        }),
        adminApi.getApplications({
          keyword: normalizeFilterText(applicationQuery),
          status: applicationStatusFilter === 'ALL' ? undefined : applicationStatusFilter,
          page: applicationPage,
          size: applicationPageSize,
        }),
      ])
      if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value.data)
      if (usersRes.status === 'fulfilled') {
        setUsers(usersRes.value.data?.content || [])
        setTotalPages(usersRes.value.data?.totalPages || 0)
        setTotalUsers(usersRes.value.data?.totalElements || 0)
      }
      if (jobsRes.status === 'fulfilled') {
        setJobs(jobsRes.value.data?.content || [])
        setTotalJobs(jobsRes.value.data?.totalElements || 0)
        setJobTotalPages(jobsRes.value.data?.totalPages || 0)
      }
      if (applicationsRes.status === 'fulfilled') {
        setApplications(applicationsRes.value.data?.content || [])
        setTotalApplications(applicationsRes.value.data?.totalElements || 0)
        setApplicationTotalPages(applicationsRes.value.data?.totalPages || 0)
      }
    } catch {
      toast.error('Unable to load admin data. Please try again.')
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => { loadData() }, [page, jobPage, applicationPage, userQuery, userRoleFilter, userStatusFilter, jobQuery, jobStatusFilter, applicationQuery, applicationStatusFilter])

  useEffect(() => {
    setSelectedUserIds([])
  }, [page, userQuery, userRoleFilter, userStatusFilter])

  useEffect(() => {
    setSelectedJobIds([])
  }, [jobPage, jobQuery, jobStatusFilter])

  const getAllMatchingUsers = async () => {
    const total = totalUsers || users.length
    const res = await adminApi.getUsers({
      keyword: normalizeFilterText(userQuery),
      role: userRoleFilter === 'ALL' ? undefined : userRoleFilter,
      isActive: userStatusFilter === 'ALL' ? undefined : userStatusFilter === 'ACTIVE',
      page: 0,
      size: Math.max(total, 1),
    })
    return res.data?.content || []
  }

  const getAllMatchingJobs = async () => {
    const total = totalJobs || jobs.length
    const res = await adminApi.getJobs({
      keyword: normalizeFilterText(jobQuery),
      status: jobStatusFilter === 'ALL' ? undefined : jobStatusFilter,
      page: 0,
      size: Math.max(total, 1),
    })
    return res.data?.content || []
  }

  const getAllMatchingApplications = async () => {
    const total = totalApplications || applications.length
    const res = await adminApi.getApplications({
      keyword: normalizeFilterText(applicationQuery),
      status: applicationStatusFilter === 'ALL' ? undefined : applicationStatusFilter,
      page: 0,
      size: Math.max(total, 1),
    })
    return res.data?.content || []
  }

  const handleExportUsers = async () => {
    const allUsersResponse = await adminApi.getUsers({
      keyword: normalizeFilterText(userQuery),
      role: userRoleFilter === 'ALL' ? undefined : userRoleFilter,
      isActive: userStatusFilter === 'ALL' ? undefined : userStatusFilter === 'ACTIVE',
      page: 0,
      size: Math.max(totalUsers || users.length || 1, 1),
    })
    const allUsers = allUsersResponse.data?.content || []

    downloadCsv(
      'admin-users.csv',
      ['Name', 'Email', 'Role', 'Status', 'Joined'],
      allUsers.map((user) => [user.fullName, user.email, user.role, user.isActive ? 'Active' : 'Inactive', user.createdAt]),
    )
    toast.success('Users exported successfully.')
  }

  const handleExportJobs = async () => {
    const allJobsResponse = await adminApi.getJobs({
      keyword: normalizeFilterText(jobQuery),
      status: jobStatusFilter === 'ALL' ? undefined : jobStatusFilter,
      page: 0,
      size: Math.max(totalJobs || jobs.length || 1, 1),
    })
    const allJobs = allJobsResponse.data?.content || []

    downloadCsv(
      'admin-jobs.csv',
      ['Title', 'Company', 'Location', 'Status', 'Type', 'Applicants', 'Views', 'Posted'],
      allJobs.map((job) => [job.title, job.company, job.location, job.status, job.jobType, job.applicationsCount, job.viewsCount, job.createdAt]),
    )
    toast.success('Jobs exported successfully.')
  }

  const handleExportApplications = async () => {
    const allApplicationsResponse = await getAllMatchingApplications()
    downloadCsv(
      'admin-applications.csv',
      ['Applicant', 'Email', 'Job', 'Company', 'Status', 'Applied'],
      allApplicationsResponse.map((application) => [application.applicantName, application.applicantEmail, application.jobTitle, application.companyName, application.status, application.appliedAt]),
    )
    toast.success('Applications exported successfully.')
  }

  const handleToggleStatus = async (user: UserItem) => {
    setToggling(user.id)
    try {
      await authApi.toggleUserStatus(user.id)
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isActive: !u.isActive } : u))
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'} successfully.`)
    } catch {
      toast.error('Unable to update user status. Please try again.')
    } finally {
      setToggling(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setDeleting(true)
    try {
      await authApi.deleteUser(deleteConfirm.id)
      setUsers((prev) => prev.filter((u) => u.id !== deleteConfirm.id))
      toast.success('User deleted successfully.')
      setDeleteConfirm(null)
    } catch {
      toast.error('Unable to delete user. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const handleDeleteJob = async () => {
    if (!deleteJobConfirm) return
    setDeletingJob(true)
    try {
      await adminApi.deleteJob(deleteJobConfirm.id)
      setJobs((prev) => prev.filter((j) => j.id !== deleteJobConfirm.id))
      setTotalJobs((prev) => Math.max(0, prev - 1))
      toast.success('Job deleted successfully.')
      setDeleteJobConfirm(null)
    } catch {
      toast.error('Unable to delete job. Please try again.')
    } finally {
      setDeletingJob(false)
    }
  }

  const handleBulkDeactivateUsers = async () => {
    const allMatchingUsers = await getAllMatchingUsers().catch(() => [])
    const activeSelectedUsers = allMatchingUsers.filter((user) => selectedUserIds.includes(user.id) && user.isActive)
    if (activeSelectedUsers.length === 0) {
      toast.error('Please select at least one active user to deactivate.')
      return
    }

    setBulkDeactivatingUsers(true)
    try {
      await Promise.allSettled(activeSelectedUsers.map((user) => authApi.toggleUserStatus(user.id)))
      setUsers((prev) => prev.map((user) => (activeSelectedUsers.some((selected) => selected.id === user.id) ? { ...user, isActive: false } : user)))
      setSelectedUserIds([])
      toast.success(`Deactivated ${activeSelectedUsers.length} user${activeSelectedUsers.length === 1 ? '' : 's'} successfully.`)
    } catch {
      toast.error('Unable to deactivate selected users. Please try again.')
    } finally {
      setBulkDeactivatingUsers(false)
    }
  }

  const handleBulkDeleteJobs = async () => {
    const allMatchingJobs = await getAllMatchingJobs().catch(() => [])
    const selectedJobs = allMatchingJobs.filter((job) => selectedJobIds.includes(job.id))
    if (selectedJobs.length === 0) {
      toast.error('Please select at least one job to delete.')
      return
    }

    setBulkDeletingJobs(true)
    try {
      await Promise.allSettled(selectedJobs.map((job) => adminApi.deleteJob(job.id)))
      setJobs((prev) => prev.filter((job) => !selectedJobIds.includes(job.id)))
      setTotalJobs((prev) => Math.max(0, prev - selectedJobs.length))
      setSelectedJobIds([])
      toast.success(`Deleted ${selectedJobs.length} job${selectedJobs.length === 1 ? '' : 's'} successfully.`)
    } catch {
      toast.error('Unable to delete selected jobs. Please try again.')
    } finally {
      setBulkDeletingJobs(false)
    }
  }

  const handleBulkJobStatusChange = async () => {
    const allMatchingJobs = await getAllMatchingJobs().catch(() => [])
    const selectedJobs = allMatchingJobs.filter((job) => selectedJobIds.includes(job.id))
    if (selectedJobs.length === 0) {
      toast.error('Please select at least one job to update.')
      return
    }

    setBulkUpdatingJobStatus(true)
    try {
      await Promise.allSettled(selectedJobs.map((job) => jobsApi.update(job.id, { status: jobBulkStatus })))
      setJobs((prev) => prev.map((job) => (selectedJobIds.includes(job.id) ? { ...job, status: jobBulkStatus } : job)))
      setSelectedJobIds([])
      toast.success(`Updated ${selectedJobs.length} job${selectedJobs.length === 1 ? '' : 's'} to ${jobBulkStatus.toLowerCase()} successfully.`)
    } catch {
      toast.error('Unable to update job status. Please try again.')
    } finally {
      setBulkUpdatingJobStatus(false)
    }
  }

  const openBulkJobConfirm = (kind: 'status' | 'delete') => {
    const count = selectedJobIds.length
    if (count === 0) {
      toast.error('Please select at least one job first.')
      return
    }

    setBulkActionConfirm({ kind, count, status: kind === 'status' ? jobBulkStatus : undefined })
  }

  const closeBulkJobConfirm = () => setBulkActionConfirm(null)

  const confirmBulkJobAction = async () => {
    if (!bulkActionConfirm) return
    const actionKind = bulkActionConfirm.kind
    closeBulkJobConfirm()
    if (actionKind === 'status') {
      await handleBulkJobStatusChange()
      return
    }
    await handleBulkDeleteJobs()
  }

  if (loadingData) return <PageSpinner />

  const TABS = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: `Users (${totalUsers})` },
    { id: 'jobs', label: `Jobs (${totalJobs || analytics?.totalJobs || 0})` },
    { id: 'applications', label: `Applications (${totalApplications || analytics?.totalApplications || 0})` },
  ] as const

  const roleOptions = [
    { label: 'All roles', value: 'ALL' },
    { label: 'Admin', value: 'ADMIN' },
    { label: 'Recruiter', value: 'RECRUITER' },
    { label: 'Job Seeker', value: 'JOB_SEEKER' },
  ] as const

  const userStatusOptions = [
    { label: 'All statuses', value: 'ALL' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Inactive', value: 'INACTIVE' },
  ] as const

  const jobStatusOptions = [
    { label: 'All statuses', value: 'ALL' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Closed', value: 'CLOSED' },
  ] as const

  const applicationStatusOptions = [
    { label: 'All statuses', value: 'ALL' },
    { label: 'Under review', value: 'UNDER_REVIEW' },
    { label: 'Shortlisted', value: 'SHORTLISTED' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'Offered', value: 'OFFERED' },
    { label: 'Applied', value: 'APPLIED' },
  ] as const

  const handleSelectAllMatchingUsers = async () => {
    setSelectingAllUsers(true)
    try {
      const matchingUsers = await getAllMatchingUsers()
      setSelectedUserIds(matchingUsers.map((user) => user.id))
      toast.success(`Selected ${matchingUsers.length} matching user${matchingUsers.length === 1 ? '' : 's'}.`)
    } catch {
      toast.error('Unable to select all matching users. Please try again.')
    } finally {
      setSelectingAllUsers(false)
    }
  }

  const handleSelectAllMatchingJobs = async () => {
    setSelectingAllJobs(true)
    try {
      const matchingJobs = await getAllMatchingJobs()
      setSelectedJobIds(matchingJobs.map((job) => job.id))
      toast.success(`Selected ${matchingJobs.length} matching job${matchingJobs.length === 1 ? '' : 's'}.`)
    } catch {
      toast.error('Unable to select all matching jobs. Please try again.')
    } finally {
      setSelectingAllJobs(false)
    }
  }

  return (
    <div className="py-8">
      <div className="page-container">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="section-title">Admin Dashboard</h1>
              <p className="text-slate-500 text-sm">Platform overview and management</p>
            </div>
          </div>
          <button onClick={loadData} className="btn-secondary flex items-center gap-2 text-sm">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-8 w-fit">
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'px-5 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === id
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
              )}
            >{label}</button>
          ))}
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard label="Total Users" value={analytics?.totalUsers ?? users.length} icon={<Users className="w-5 h-5" />} color="blue" />
              <StatsCard label="Total Jobs" value={analytics?.totalJobs ?? '-'} icon={<Briefcase className="w-5 h-5" />} color="green" />
              <StatsCard label="Applications" value={analytics?.totalApplications ?? '-'} icon={<FileText className="w-5 h-5" />} color="purple" />
              <StatsCard label="Active Jobs" value={analytics?.activeJobs ?? '-'} icon={<TrendingUp className="w-5 h-5" />} color="orange" />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="card p-5">
                <h3 className="font-semibold mb-4">User Breakdown</h3>
                {[
                  { label: 'Job Seekers', count: users.filter((u) => u.role === 'JOB_SEEKER').length, color: 'bg-brand-500' },
                  { label: 'Recruiters', count: users.filter((u) => u.role === 'RECRUITER').length, color: 'bg-purple-500' },
                  { label: 'Admins', count: users.filter((u) => u.role === 'ADMIN').length, color: 'bg-orange-500' },
                ].map(({ label, count, color }) => {
                  const total = users.length || 1
                  const filledSegments = Math.round((count / total) * 20)
                  return (
                    <div key={label} className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-600 dark:text-slate-400">{label}</span>
                        <span className="font-semibold">{count}</span>
                      </div>
                      <div className="flex gap-0.5 h-2">
                        {Array.from({ length: 20 }).map((_, idx) => (
                          <div
                            key={`${label}-${idx}`}
                            className={`flex-1 rounded-full ${idx < filledSegments ? color : 'bg-slate-100 dark:bg-slate-800'}`}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="card p-5">
                <h3 className="font-semibold mb-4">Recent Users</h3>
                <div className="space-y-3">
                  {users.slice(0, 5).map((u) => (
                    <div key={u.id} className="flex items-center gap-3">
                      <Avatar name={u.fullName} src={u.profileImageUrl} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{u.fullName}</p>
                        <p className="text-xs text-slate-500">{u.role?.replace('_', ' ')}</p>
                      </div>
                      <span className="text-xs text-slate-400">{timeAgo(u.createdAt)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="animate-fade-in">
            <div className="card p-4 mb-4 grid gap-3 md:grid-cols-3">
              <input
                value={userQuery}
                onChange={(e) => setUserQuery(e.target.value)}
                placeholder="Search users by name or email"
                className="input-field"
              />
              <select aria-label="Filter users by role" value={userRoleFilter} onChange={(e) => setUserRoleFilter(e.target.value as typeof userRoleFilter)} className="input-field">
                {roleOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <select aria-label="Filter users by status" value={userStatusFilter} onChange={(e) => setUserStatusFilter(e.target.value as typeof userStatusFilter)} className="input-field">
                {userStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div className="mb-4 flex items-center justify-end">
              <button onClick={handleExportUsers} className="btn-secondary text-sm inline-flex items-center gap-2">
                <FileText className="w-4 h-4" /> Export CSV
              </button>
            </div>
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {selectedUsersCount > 0 ? `${selectedUsersCount} user${selectedUsersCount === 1 ? '' : 's'} selected` : 'Select users to bulk deactivate.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleSelectAllMatchingUsers}
                  disabled={selectingAllUsers}
                  className="btn-secondary text-sm inline-flex items-center gap-2"
                >
                  {selectingAllUsers ? <Spinner size="sm" /> : <Users className="w-4 h-4" />}
                  Select all matching
                </button>
                <button
                  onClick={() => setSelectedUserIds(visibleUserIds)}
                  disabled={visibleUserIds.length === 0 || allVisibleUsersSelected}
                  className="btn-secondary text-sm"
                >
                  Select visible
                </button>
                <button
                  onClick={() => setSelectedUserIds([])}
                  disabled={selectedUsersCount === 0}
                  className="btn-ghost text-sm"
                >
                  Clear selection
                </button>
                <button
                  onClick={handleBulkDeactivateUsers}
                  disabled={selectedUsersCount === 0 || bulkDeactivatingUsers}
                  className="btn-danger text-sm inline-flex items-center gap-2"
                >
                  {bulkDeactivatingUsers ? <Spinner size="sm" /> : <ToggleLeft className="w-4 h-4" />}
                  Bulk deactivate
                </button>
              </div>
            </div>
            <div className="card overflow-hidden border border-slate-200/70 dark:border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-white to-brand-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          aria-label="Select visible users"
                          checked={allVisibleUsersSelected}
                          onChange={(e) => setSelectedUserIds(e.target.checked ? visibleUserIds : [])}
                        />
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Role</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Joined</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-brand-50/40 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 align-top">
                          <input
                            type="checkbox"
                            aria-label={`Select user ${u.fullName}`}
                            checked={selectedUserIds.includes(u.id)}
                            onChange={(e) => {
                              setSelectedUserIds((prev) => e.target.checked ? [...prev, u.id] : prev.filter((id) => id !== u.id))
                            }}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar name={u.fullName} src={u.profileImageUrl} size="sm" />
                            <div className="min-w-0">
                              <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{u.fullName}</p>
                              <p className="text-xs text-slate-500 truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className={cn('badge text-xs', u.role === 'ADMIN' ? 'badge-purple shadow-purple-100/50' : u.role === 'RECRUITER' ? 'badge-blue shadow-cyan-100/50' : 'badge-slate')}>
                            {u.role?.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 hidden lg:table-cell">{timeAgo(u.createdAt)}</td>
                        <td className="px-4 py-3">
                          <span className={cn('badge text-xs', u.isActive ? 'badge-green shadow-emerald-100/50' : 'badge-red shadow-rose-100/50')}>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleStatus(u)}
                              disabled={toggling === u.id}
                              className="btn-ghost p-1.5 rounded-lg border border-transparent hover:border-brand-200 dark:hover:border-brand-700"
                              title={u.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {toggling === u.id ? <Spinner size="sm" /> : <ToggleLeft className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(u)}
                              className="btn-ghost p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-200 dark:hover:border-red-800"
                              title="Delete user"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="animate-fade-in space-y-4">
            <div className="card p-4 mb-4 grid gap-3 md:grid-cols-2">
              <input
                value={jobQuery}
                onChange={(e) => setJobQuery(e.target.value)}
                placeholder="Search jobs by title, company, or location"
                className="input-field"
              />
              <select aria-label="Filter jobs by status" value={jobStatusFilter} onChange={(e) => setJobStatusFilter(e.target.value as typeof jobStatusFilter)} className="input-field">
                {jobStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <select aria-label="Bulk job status target" value={jobBulkStatus} onChange={(e) => setJobBulkStatus(e.target.value as JobStatus)} className="input-field min-w-[160px]">
                  {JOB_STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <button
                  onClick={() => openBulkJobConfirm('status')}
                  disabled={selectedJobsCount === 0 || bulkUpdatingJobStatus}
                  className="btn-primary text-sm inline-flex items-center gap-2"
                >
                  {bulkUpdatingJobStatus ? <Spinner size="sm" /> : <ToggleLeft className="w-4 h-4" />}
                  Bulk update status
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => openBulkJobConfirm('delete')} disabled={selectedJobsCount === 0 || bulkDeletingJobs} className="btn-danger text-sm inline-flex items-center gap-2">
                  {bulkDeletingJobs ? <Spinner size="sm" /> : <Trash2 className="w-4 h-4" />}
                  Bulk delete
                </button>
                <button onClick={handleExportJobs} className="btn-secondary text-sm inline-flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Export CSV
                </button>
              </div>
            </div>
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 p-4">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {selectedJobsCount > 0 ? `${selectedJobsCount} job${selectedJobsCount === 1 ? '' : 's'} selected` : 'Select jobs to bulk delete.'}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleSelectAllMatchingJobs}
                  disabled={selectingAllJobs}
                  className="btn-secondary text-sm inline-flex items-center gap-2"
                >
                  {selectingAllJobs ? <Spinner size="sm" /> : <Briefcase className="w-4 h-4" />}
                  Select all matching
                </button>
                <button
                  onClick={() => setSelectedJobIds(visibleJobIds)}
                  disabled={visibleJobIds.length === 0 || allVisibleJobsSelected}
                  className="btn-secondary text-sm"
                >
                  Select visible
                </button>
                <button
                  onClick={() => setSelectedJobIds([])}
                  disabled={selectedJobsCount === 0}
                  className="btn-ghost text-sm"
                >
                  Clear selection
                </button>
                <button
                  onClick={() => openBulkJobConfirm('delete')}
                  disabled={selectedJobsCount === 0 || bulkDeletingJobs}
                  className="btn-danger text-sm inline-flex items-center gap-2"
                >
                  {bulkDeletingJobs ? <Spinner size="sm" /> : <Trash2 className="w-4 h-4" />}
                  Bulk delete
                </button>
              </div>
            </div>
            <div className="card overflow-hidden border border-slate-200/70 dark:border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-white to-brand-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
                      <th className="px-4 py-3 w-10">
                        <input
                          type="checkbox"
                          aria-label="Select visible jobs"
                          checked={allVisibleJobsSelected}
                          onChange={(e) => setSelectedJobIds(e.target.checked ? visibleJobIds : [])}
                        />
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Job</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Company</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Posted</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr key={job.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-brand-50/40 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-4 py-3 align-top">
                          <input
                            type="checkbox"
                            aria-label={`Select job ${job.title}`}
                            checked={selectedJobIds.includes(job.id)}
                            onChange={(e) => {
                              setSelectedJobIds((prev) => e.target.checked ? [...prev, job.id] : prev.filter((id) => id !== job.id))
                            }}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{job.title}</p>
                            <p className="text-xs text-slate-500 truncate">{job.location || '-'}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-slate-600 dark:text-slate-400">{job.company || '-'}</td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="badge-slate text-xs">{job.status || '-'}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{timeAgo(job.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setDeleteJobConfirm(job)}
                              className="btn-ghost p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-200 dark:hover:border-red-800"
                              title="Delete job"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Pagination page={jobPage} totalPages={jobTotalPages} onPageChange={setJobPage} />
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="animate-fade-in space-y-4">
            <div className="card p-4 grid gap-3 md:grid-cols-2">
              <input
                value={applicationQuery}
                onChange={(e) => setApplicationQuery(e.target.value)}
                placeholder="Search applications by applicant, job, or company"
                className="input-field"
              />
              <select aria-label="Filter applications by status" value={applicationStatusFilter} onChange={(e) => setApplicationStatusFilter(e.target.value as typeof applicationStatusFilter)} className="input-field">
                {applicationStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div className="mb-4 flex items-center justify-end">
              <button onClick={handleExportApplications} className="btn-secondary text-sm inline-flex items-center gap-2">
                <FileText className="w-4 h-4" /> Export CSV
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatsCard label="Total" value={totalApplications} icon={<FileText className="w-4 h-4" />} color="blue" />
              <StatsCard label="Under Review" value={applications.filter((a) => a.status === 'UNDER_REVIEW').length} icon={<TrendingUp className="w-4 h-4" />} color="orange" />
              <StatsCard label="Shortlisted" value={applications.filter((a) => a.status === 'SHORTLISTED').length} icon={<Users className="w-4 h-4" />} color="green" />
              <StatsCard label="Rejected" value={applications.filter((a) => a.status === 'REJECTED').length} icon={<Trash2 className="w-4 h-4" />} color="purple" />
            </div>

            <div className="card overflow-hidden border border-slate-200/70 dark:border-slate-800">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-white to-brand-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Applicant</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Job</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Applied</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((application) => (
                      <tr key={application.id} className="border-b border-slate-50 dark:border-slate-800/50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900 dark:text-slate-100">{application.applicantName || 'Unknown'}</p>
                          <p className="text-xs text-slate-500">{application.applicantEmail || '-'}</p>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell text-slate-600 dark:text-slate-400">{application.jobTitle || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={cn('badge text-xs', application.status === 'SHORTLISTED' ? 'badge-green' : application.status === 'REJECTED' ? 'badge-red' : 'badge-blue')}>
                            {application.status?.replace('_', ' ') || 'UNKNOWN'}
                          </span>
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell text-xs text-slate-500">{timeAgo(application.appliedAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <Pagination page={applicationPage} totalPages={applicationTotalPages} onPageChange={setApplicationPage} />
          </div>
        )}
      </div>

      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Delete User">
        <div className="text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
            <Trash2 className="w-7 h-7 text-rose-500" />
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Permanently delete <strong>{deleteConfirm?.fullName}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleDelete} disabled={deleting} className="btn-danger flex-1">
              {deleting ? <Spinner size="sm" /> : 'Delete User'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteJobConfirm} onClose={() => setDeleteJobConfirm(null)} title="Delete Job">
        <div className="text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
            <Trash2 className="w-7 h-7 text-rose-500" />
          </div>
          <p className="text-slate-600 dark:text-slate-400">
            Permanently delete <strong>{deleteJobConfirm?.title}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteJobConfirm(null)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleDeleteJob} disabled={deletingJob} className="btn-danger flex-1">
              {deletingJob ? <Spinner size="sm" /> : 'Delete Job'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!bulkActionConfirm} onClose={closeBulkJobConfirm} title={bulkActionConfirm?.kind === 'status' ? 'Confirm bulk status update' : 'Confirm bulk delete'}>
        <div className="space-y-4">
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/60 p-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              You are about to {bulkActionConfirm?.kind === 'status' ? 'update the status of' : 'delete'} <strong>{bulkActionConfirm?.count ?? 0}</strong> selected job{(bulkActionConfirm?.count ?? 0) === 1 ? '' : 's'}.
            </p>
            {bulkActionConfirm?.kind === 'status' && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                New status: <strong>{bulkActionConfirm.status}</strong>
              </p>
            )}
            {bulkActionConfirm?.kind === 'delete' && (
              <p className="text-sm text-rose-600 dark:text-rose-300 mt-2">
                This cannot be undone.
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={closeBulkJobConfirm} className="btn-secondary flex-1">Cancel</button>
            <button onClick={confirmBulkJobAction} className={bulkActionConfirm?.kind === 'delete' ? 'btn-danger flex-1' : 'btn-primary flex-1'}>
              Confirm
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
