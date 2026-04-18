import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../shared/hooks/redux'
import { getJobByIdThunk } from '../../store/slices/jobsSlice'
import { applyThunk, applyWithResumeThunk, getMyApplicationsThunk } from '../../store/slices/applicationsSlice'
import {
  MapPin, Briefcase, Clock, DollarSign, Wifi, Users, Eye, ArrowLeft,
  Building2, Calendar, ChevronRight, Upload, FileText
} from 'lucide-react'
import {
  PageSpinner, Modal, Spinner, EmptyState, Avatar
} from '../../shared/components/ui'
import { formatSalary, timeAgo, formatDate, JOB_TYPE_LABELS, EXP_LEVEL_LABELS } from '../../shared/utils/helpers'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { currentJob, loading } = useAppSelector((s) => s.jobs)
  const { user, isAuthenticated } = useAppSelector((s) => s.auth)
  const { loading: appLoading, myApplications } = useAppSelector((s) => s.applications)

  const [applyOpen, setApplyOpen] = useState(false)
  const [coverLetter, setCoverLetter] = useState('')
  const [resume, setResume] = useState<File | null>(null)

  useEffect(() => {
    if (id) dispatch(getJobByIdThunk({ id, incrementViewCount: true }))
  }, [id, dispatch])

  useEffect(() => {
    if (isAuthenticated && user?.role === 'JOB_SEEKER') {
      dispatch(getMyApplicationsThunk({ page: 0, size: 100 }))
    }
  }, [dispatch, isAuthenticated, user?.role])

  const handleApply = async () => {
    if (!id || !currentJob?.id) return
    let res
    if (resume) {
      res = await dispatch(applyWithResumeThunk({ jobId: currentJob.id, coverLetter, resume }))
    } else {
      res = await dispatch(applyThunk({ jobId: currentJob.id, coverLetter }))
    }
    if (applyThunk.fulfilled.match(res) || applyWithResumeThunk.fulfilled.match(res)) {
      toast.success('Application submitted successfully. Redirecting to My Applications...')
      setCoverLetter('')
      setResume(null)
      setApplyOpen(false)
      sessionStorage.setItem('jobApplySuccess', '1')
      const redirectParams = new URLSearchParams({
        applied: '1',
        jobTitle: currentJob?.title || '',
        companyName: currentJob?.company || '',
      })
      navigate(`/applications?${redirectParams.toString()}`, {
        state: {
          submitted: true,
          feedbackPrompt: true,
          jobTitle: currentJob?.title,
          companyName: currentJob?.company,
        },
      })
    } else {
      toast.error((res?.payload as string) || 'Failed to submit application. Please try again.')
    }
  }

  if (loading) return <PageSpinner />
  if (!currentJob) return (
    <div className="page-container py-16">
      <EmptyState title="Job not found" description="This job may have been removed or doesn't exist." />
    </div>
  )

  const job = currentJob
  const canApply = isAuthenticated && user?.role === 'JOB_SEEKER'
  const currentJobId = currentJob.id
  const existingApplication = canApply
    ? myApplications.find((application) => application.jobId === currentJobId)
    : undefined
  const isRejected = existingApplication?.status === 'REJECTED'
  const isAlreadyApplied = !!existingApplication && !isRejected

  return (
    <div className="py-8">
      <div className="page-container">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-body-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-6 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to jobs
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header card */}
            <div className="card group relative overflow-hidden p-6">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-cyan-500 to-indigo-500" />
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-brand-500/10 blur-2xl opacity-70" />
              <div className="flex items-start gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-100 to-brand-200 dark:from-brand-900 dark:to-brand-800 flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-7 h-7 text-brand-600 dark:text-brand-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <h1 className="font-display text-display-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">{job.title}</h1>
                  <p className="text-body-sm text-slate-600 dark:text-slate-400 font-medium">{job.company}</p>
                </div>
                {job.status === 'ACTIVE' ? (
                  <span className="badge-green flex-shrink-0">Active</span>
                ) : (
                  <span className="badge-red flex-shrink-0">{job.status}</span>
                )}
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2 text-body-sm text-slate-500 mb-4">
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-brand-500" />{job.location}</span>
                <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-brand-500" />{JOB_TYPE_LABELS[job.jobType] || job.jobType}</span>
                {job.isRemote && <span className="flex items-center gap-1.5"><Wifi className="w-4 h-4 text-brand-500" />Remote</span>}
                <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-brand-500" />{timeAgo(job.createdAt)}</span>
              </div>

              {(job.salaryMin || job.salaryMax) && (
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-body-sm">
                  <DollarSign className="w-4 h-4" />
                  <span>{formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}</span>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="card p-6">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-body-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">{job.description}</p>
              </div>
            </div>

            {job.requirements && (
              <div className="card p-6 border border-slate-100/80 dark:border-slate-800/80">
                <h2 className="font-display text-display-lg font-semibold mb-4">Requirements</h2>
                <p className="text-body-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">{job.requirements}</p>
              </div>
            )}

            {job.responsibilities && (
              <div className="card p-6">
                <h2 className="font-display text-display-lg font-semibold mb-4">Responsibilities</h2>
                <p className="text-body-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">{job.responsibilities}</p>
              </div>
            )}

            {job.skills && (
              <div className="card p-6">
                <h2 className="font-display text-display-lg font-semibold mb-4">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {job.skills.split(',').map((s) => (
                    <span key={s.trim()} className="px-3 py-1.5 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-body-sm rounded-lg font-medium">
                      {s.trim()}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Apply card */}
            <div className="card p-5 border border-slate-100/80 dark:border-slate-800/80">
              <div className="flex items-center justify-between text-body-sm text-slate-500 mb-4">
                <span className="flex items-center gap-1 rounded-full bg-slate-50 dark:bg-slate-800/70 px-2.5 py-1.5"><Eye className="w-4 h-4 text-brand-500" />{job.viewsCount} views</span>
                <span className="flex items-center gap-1 rounded-full bg-slate-50 dark:bg-slate-800/70 px-2.5 py-1.5"><Users className="w-4 h-4 text-cyan-500" />{job.applicationsCount} applied</span>
              </div>

              {canApply && isRejected ? (
                <button disabled className="btn-secondary w-full py-3 text-base cursor-not-allowed opacity-70">
                  Rejected
                </button>
              ) : canApply && isAlreadyApplied ? (
                <button disabled className="btn-secondary w-full py-3 text-base cursor-not-allowed opacity-70">
                  Already Applied
                </button>
              ) : canApply ? (
                <button onClick={() => setApplyOpen(true)} className="btn-primary w-full py-3 text-base">
                  Apply Now <ChevronRight className="w-4 h-4" />
                </button>
              ) : !isAuthenticated ? (
                <Link to="/login" className="btn-primary w-full py-3 text-base text-center block">
                  Sign in to Apply
                </Link>
              ) : (
                <p className="text-body-sm text-slate-500 text-center p-3 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  Only job seekers can apply
                </p>
              )}

              {job.applicationDeadline && (
                <p className="text-body-xs text-slate-500 text-center mt-3 flex items-center justify-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Deadline: {formatDate(job.applicationDeadline)}
                </p>
              )}
            </div>

            {/* Job details card */}
            <div className="card p-5 space-y-3 border border-slate-100/80 dark:border-slate-800/80">
              <h3 className="font-display text-display-lg font-semibold text-slate-700 dark:text-slate-300">Job Details</h3>
              {[
                { label: 'Category', value: job.category || '-' },
                { label: 'Job Type', value: JOB_TYPE_LABELS[job.jobType] || job.jobType },
                { label: 'Experience', value: EXP_LEVEL_LABELS[job.experienceLevel] || job.experienceLevel },
                { label: 'Remote', value: job.isRemote ? 'Yes' : 'On-site' },
                { label: 'Posted', value: timeAgo(job.createdAt) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-body-sm">
                  <span className="text-slate-500">{label}</span>
                  <span className="font-medium text-body-sm text-slate-800 dark:text-slate-200">{value}</span>
                </div>
              ))}
            </div>

            {/* Recruiter info */}
            {job.recruiterName && (
              <div className="card p-5 border border-slate-100/80 dark:border-slate-800/80">
                <h3 className="font-display text-display-lg font-semibold text-slate-700 dark:text-slate-300 mb-3">Posted by</h3>
                <div className="flex items-center gap-3">
                  <Avatar name={job.recruiterName} size="md" />
                  <div>
                    <p className="text-body-sm font-semibold text-slate-900 dark:text-slate-100">{job.recruiterName}</p>
                    <p className="text-body-xs text-slate-500">{job.recruiterEmail}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      <Modal open={applyOpen} onClose={() => setApplyOpen(false)} title={`Apply for ${job.title}`} maxWidth="max-w-2xl">
        <div className="space-y-5">
          <div className="p-3 rounded-xl bg-gradient-to-r from-slate-50 to-brand-50/50 dark:from-slate-800 dark:to-slate-800/80 border border-slate-100 dark:border-slate-700">
            <p className="font-semibold text-body-sm text-slate-900 dark:text-slate-100">{job.title}</p>
            <p className="text-body-xs text-slate-500">{job.company} · {job.location}</p>
          </div>

          <div>
            <label className="label">Cover Letter (optional)</label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              rows={5}
              placeholder="Tell the recruiter why you're a great fit..."
              className="input-field resize-none"
            />
          </div>

          <div>
            <label className="label">Resume (optional)</label>
            <label className={`flex items-center gap-3 p-4 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${resume ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20' : 'border-slate-200 dark:border-slate-700 hover:border-brand-300'}`}>
              <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={(e) => setResume(e.target.files?.[0] || null)} />
              {resume ? (
                <><FileText className="w-5 h-5 text-brand-500" /><span className="text-body-sm font-medium text-brand-700 dark:text-brand-300">{resume.name}</span></>
              ) : (
                <><Upload className="w-5 h-5 text-slate-400" /><span className="text-body-sm text-slate-500">Upload resume (PDF, DOC, DOCX)</span></>
              )}
            </label>
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={() => setApplyOpen(false)} className="btn-secondary flex-1">Cancel</button>
            <button onClick={handleApply} disabled={appLoading} className="btn-primary flex-1 py-3">
              {appLoading ? <><Spinner size="sm" /> Submitting...</> : 'Submit Application'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
