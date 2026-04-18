import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../shared/hooks/redux'
import { getMyJobsThunk, deleteJobThunk } from '../../store/slices/jobsSlice'
import { Plus, Edit2, Trash2, Eye, Users, MoreVertical, Briefcase, AlertTriangle } from 'lucide-react'
import { PageSpinner, EmptyState, Modal, Spinner, Pagination } from '../../shared/components/ui'
import { timeAgo, STATUS_COLORS, cn } from '../../shared/utils/helpers'
import type { JobResponse } from '../../core/api/services'
import { FeedbackPromptModal } from '../../shared/components/feedback/FeedbackPromptModal'

function JobRow({ job }: { job: JobResponse }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const dispatch = useAppDispatch()

  const handleDelete = async () => {
    setDeleting(true)
    await dispatch(deleteJobThunk(job.id))
    setDeleting(false)
    setDeleteConfirm(false)
  }

  return (
    <div className="card group relative overflow-hidden p-5 animate-fade-in">
      <div className={cn('absolute inset-x-0 top-0 h-1', job.status === 'ACTIVE' ? 'bg-gradient-to-r from-emerald-500 via-cyan-500 to-brand-500' : 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500')} />
      <div className="absolute -left-10 -top-10 h-24 w-24 rounded-full bg-brand-500/10 blur-2xl opacity-60 transition-opacity group-hover:opacity-100" />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-display text-display-lg font-semibold text-slate-900 dark:text-slate-100 truncate">{job.title}</h3>
            <span className={cn('badge', STATUS_COLORS[job.status])}>{job.status}</span>
          </div>
          <p className="text-body-sm text-slate-500">{job.company} · {job.location}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to={`/recruiter/jobs/${job.id}/edit`}
            className="btn-secondary inline-flex items-center gap-2 px-3 py-2 text-xs sm:text-sm"
            state={{ job }}
            onClick={() => setMenuOpen(false)}
            aria-label="Edit job"
            title="Edit job"
          >
            <Edit2 className="w-4 h-4" />
            <span className="hidden sm:inline">Edit</span>
          </Link>
          <button
            onClick={() => setDeleteConfirm(true)}
            className="btn-danger inline-flex items-center gap-2 px-3 py-2 text-xs sm:text-sm"
            aria-label="Delete job"
            title="Delete job"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">Delete</span>
          </button>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="btn-ghost p-1.5 rounded-lg border border-transparent hover:border-brand-200 dark:hover:border-brand-700"
              aria-label="Open job actions"
              title="Open job actions"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-1 w-44 card shadow-xl ring-1 ring-slate-200/80 dark:ring-slate-700/80 py-1 z-10 animate-slide-down bg-white/95 dark:bg-slate-900/95 backdrop-blur">
                <Link
                  to={`/jobs/${job.id}`}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  onClick={() => setMenuOpen(false)}
                >
                  <Eye className="w-4 h-4" /> View Listing
                </Link>
                <Link
                  to={`/recruiter/applications?jobId=${job.id}&jobTitle=${encodeURIComponent(job.title)}`}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  onClick={() => setMenuOpen(false)}
                >
                  <Users className="w-4 h-4" /> View Applicants
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-slate-500">
        <span className="flex items-center gap-1 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 px-2.5 py-2">
          <Eye className="w-3 h-3 text-brand-500" />{job.viewsCount} views
        </span>
        <span className="flex items-center gap-1 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 px-2.5 py-2">
          <Users className="w-3 h-3 text-cyan-500" />{job.applicationsCount} applicants
        </span>
        <span className="flex items-center gap-1 rounded-xl bg-slate-50/80 dark:bg-slate-800/60 px-2.5 py-2 justify-center">
          Posted {timeAgo(job.createdAt)}
        </span>
      </div>

      <Modal open={deleteConfirm} onClose={() => setDeleteConfirm(false)} title="Delete Job">
        <div className="text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-red-500" />
          </div>
          <p className="text-body-sm text-slate-600 dark:text-slate-400">Delete <strong>"{job.title}"</strong>? This cannot be undone and will remove all associated applications.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteConfirm(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleDelete} disabled={deleting} className="btn-danger flex-1">
              {deleting ? <Spinner size="sm" /> : 'Delete Job'}
            </button>
          </div>
        </div>
      </Modal>

    </div>
  )
}

export default function RecruiterJobsPage() {
  const dispatch = useAppDispatch()
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { myJobs, myJobsLoading, myJobsTotalPages, myJobsTotalElements } = useAppSelector((s) => s.jobs)
  const { user } = useAppSelector((s) => s.auth)
  const [page, setPage] = useState(() => Number(searchParams.get('page')) || 0)
  const successState = location.state as { feedbackPrompt?: boolean; jobTitle?: string } | null
  
  // Show feedback prompt only on first job posting
  const hasSeenJobPostingFeedback = localStorage.getItem('hasSeenJobPostingFeedback') === 'true'
  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState(Boolean(successState?.feedbackPrompt && !hasSeenJobPostingFeedback))
  const pageSize = 10

  useEffect(() => { dispatch(getMyJobsThunk({ page, size: pageSize })) }, [dispatch, page])

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams)
    if (page > 0) nextParams.set('page', String(page))
    else nextParams.delete('page')
    setSearchParams(nextParams, { replace: true })
  }, [page, searchParams, setSearchParams])

  useEffect(() => {
    if (!successState?.feedbackPrompt) return

    setShowFeedbackPrompt(true)
    navigate({ pathname: location.pathname, search: location.search }, { replace: true })
  }, [location.pathname, location.search, navigate, successState?.feedbackPrompt])

  const dismissFeedbackPrompt = () => {
    setShowFeedbackPrompt(false)
    localStorage.setItem('hasSeenJobPostingFeedback', 'true')
  }
  const feedbackName = user?.fullName || 'Recruiter'
  const feedbackRole = user?.companyName || 'Recruiter'

  if (myJobsLoading) return <PageSpinner />

  const activeCount = myJobs.filter((j) => j.status === 'ACTIVE').length
  const totalApplicants = myJobs.reduce((sum, j) => sum + j.applicationsCount, 0)

  return (
    <div className="py-8">
      <div className="page-container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="section-title mb-1">My Job Postings</h1>
            <p className="text-body-sm text-slate-500">{myJobsTotalElements} jobs · {activeCount} active · {totalApplicants} applicants on this page</p>
          </div>
          <Link to="/recruiter/post-job" className="btn-primary">
            <Plus className="w-4 h-4" /> Post New Job
          </Link>
        </div>

        {myJobs.length === 0 ? (
          <EmptyState
            title="No jobs posted yet"
            description="Post your first job to start receiving applications."
            icon={<Briefcase className="w-12 h-12" />}
            action={<Link to="/recruiter/post-job" className="btn-primary"><Plus className="w-4 h-4" /> Post a Job</Link>}
          />
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              {myJobs.map((job) => (
                <JobRow key={job.id} job={job} />
              ))}
            </div>
            <Pagination page={page} totalPages={myJobsTotalPages} onPageChange={setPage} />
          </>
        )}

        <FeedbackPromptModal
          open={showFeedbackPrompt}
          onClose={dismissFeedbackPrompt}
          title="Share your posting feedback"
          description={successState?.jobTitle
            ? `How was posting ${successState.jobTitle}?`
            : 'How was your job posting experience?'}
          defaultName={feedbackName}
          defaultRole={feedbackRole}
        />
      </div>
    </div>
  )
}
