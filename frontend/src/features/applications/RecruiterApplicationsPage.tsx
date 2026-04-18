import { useEffect, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../../shared/hooks/redux'
import { getRecruiterInboxThunk, getJobApplicantsThunk, updateStatusThunk } from '../../store/slices/applicationsSlice'
import { Clock, CheckCircle2, XCircle, Award, ChevronDown, Filter, ExternalLink, FileText, Download, Search, Eye } from 'lucide-react'
import { PageSpinner, EmptyState, Modal, Spinner, Pagination } from '../../shared/components/ui'
import { timeAgo, STATUS_COLORS, cn } from '../../shared/utils/helpers'
import { Link, useSearchParams } from 'react-router-dom'
import type { ApplicationResponse } from '../../core/api/services'

const STATUSES = [
  { value: 'UNDER_REVIEW', label: 'Under Review', icon: Clock },
  { value: 'SHORTLISTED', label: 'Shortlist', icon: CheckCircle2 },
  { value: 'INTERVIEW_SCHEDULED', label: 'Interview', icon: CheckCircle2 },
  { value: 'OFFERED', label: 'Offer', icon: Award },
  { value: 'REJECTED', label: 'Reject', icon: XCircle },
]

const STATUS_LABELS: Record<string, string> = {
  APPLIED: 'Applied', UNDER_REVIEW: 'Under Review', SHORTLISTED: 'Shortlisted',
  INTERVIEW_SCHEDULED: 'Interview Scheduled', OFFERED: 'Offered', REJECTED: 'Rejected', WITHDRAWN: 'Withdrawn',
}

interface ApplicantCardProps {
  app: ApplicationResponse
  onUpdateClick: (app: ApplicationResponse) => void
  onViewDetailsClick: (app: ApplicationResponse) => void
  isSelected?: boolean
  onSelectChange?: (id: number, selected: boolean) => void
  showCheckbox?: boolean
}

function ApplicantCard({ 
  app, 
  onUpdateClick, 
  onViewDetailsClick,
  isSelected = false, 
  onSelectChange, 
  showCheckbox = false 
}: ApplicantCardProps) {
  return (
    <div className={cn('card p-5 animate-fade-in transition-colors', isSelected && 'bg-brand-50/50 dark:bg-brand-900/10 border-brand-300 dark:border-brand-700')}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex gap-3 flex-1 min-w-0">
          {showCheckbox && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => onSelectChange?.(app.id, e.target.checked)}
              className="mt-1 w-4 h-4 cursor-pointer"
            />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <button
                onClick={() => onViewDetailsClick(app)}
                className="text-display-lg font-semibold text-slate-900 dark:text-slate-100 hover:text-brand-600 dark:hover:text-brand-400 font-display text-left transition-colors"
              >
                {app.applicantName || 'Applicant'}
              </button>
              <span className={cn('badge', STATUS_COLORS[app.status])}>
                {STATUS_LABELS[app.status] || app.status}
              </span>
            </div>
            <p className="text-body-xs text-slate-500">{app.applicantEmail}</p>
            {app.applicantPhone && <p className="text-body-xs text-slate-500">{app.applicantPhone}</p>}
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={() => onViewDetailsClick(app)}
            className="btn-ghost p-2 rounded-lg"
            title="View full details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => onUpdateClick(app)}
            className="btn-secondary text-body-xs px-3 py-1.5 flex items-center gap-1"
          >
            Update <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg mb-3">
        <p className="text-body-xs font-semibold text-slate-500 mb-0.5">Applied for</p>
        <p className="text-body-sm font-medium text-slate-800 dark:text-slate-200">{app.jobTitle}</p>
        <p className="text-body-xs text-slate-500">{app.companyName}</p>
      </div>

      {app.coverLetter && (
        <details className="mb-3">
          <summary className="text-body-xs text-brand-600 cursor-pointer font-medium hover:underline">
            View cover letter
          </summary>
          <p className="text-body-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed line-clamp-4">{app.coverLetter}</p>
        </details>
      )}

      <div className="flex items-center justify-between text-body-xs text-slate-400">
        <span>Applied {timeAgo(app.appliedAt)}</span>
        <div className="flex items-center gap-3">
          {app.resumeUrl && (
            <>
              <a
                href={app.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-body-xs text-brand-600 hover:underline"
              >
                <FileText className="w-3 h-3" /> View Resume
              </a>
              <a
                href={app.resumeUrl}
                download
                className="flex items-center gap-1 text-body-xs text-brand-600 hover:underline"
              >
                <Download className="w-3 h-3" /> Download
              </a>
            </>
          )}
          <Link to={`/jobs/${app.jobId}`} className="flex items-center gap-1 text-body-xs text-brand-600 hover:underline">
            <ExternalLink className="w-3 h-3" /> Job
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function RecruiterApplicationsPage() {
  const dispatch = useAppDispatch()
  const {
    recruiterInbox,
    jobApplicants,
    loading,
    recruiterInboxTotalPages,
    recruiterInboxTotalElements,
    jobApplicantsTotalPages,
  } = useAppSelector((s) => s.applications)
  const [searchParams, setSearchParams] = useSearchParams()
  const [filterStatus, setFilterStatus] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(() => Number(searchParams.get('page')) || 0)
  const [selectedApp, setSelectedApp] = useState<ApplicationResponse | null>(null)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [updating, setUpdating] = useState(false)
  const [detailedApp, setDetailedApp] = useState<ApplicationResponse | null>(null)
  const [selectedApplicants, setSelectedApplicants] = useState<Set<number>>(new Set())
  const [bulkStatus, setBulkStatus] = useState('')
  const [bulkNote, setBulkNote] = useState('')
  const [bulkUpdating, setBulkUpdating] = useState(false)
  const pageSize = 20
  const selectedJobParam = searchParams.get('jobId')
  const selectedJobId = selectedJobParam && selectedJobParam.trim() ? selectedJobParam : null
  const selectedJobTitle = searchParams.get('jobTitle')
  const isJobScoped = selectedJobId !== null

  useEffect(() => {
    setPage(0)
  }, [selectedJobId])

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams)
    if (filterStatus) nextParams.set('status', filterStatus)
    else nextParams.delete('status')
    if (page > 0) nextParams.set('page', String(page))
    else nextParams.delete('page')
    if (selectedJobId !== null) {
      nextParams.set('jobId', selectedJobId)
      if (selectedJobTitle) nextParams.set('jobTitle', selectedJobTitle)
    }
    setSearchParams(nextParams, { replace: true })
  }, [filterStatus, page, searchParams, selectedJobId, selectedJobTitle, setSearchParams])

  useEffect(() => {
    if (isJobScoped && selectedJobId) {
      dispatch(getJobApplicantsThunk({ jobId: selectedJobId, page, size: pageSize }))
      return
    }
    dispatch(getRecruiterInboxThunk({ page, size: pageSize }))
  }, [dispatch, isJobScoped, page, selectedJobId])

  const handleUpdateStatusClick = (app: ApplicationResponse) => {
    setSelectedApp(app)
    setSelectedStatus('')
    setStatusNote('')
  }

  const handleUpdateStatus = async () => {
    if (!selectedApp || !selectedStatus) return
    setUpdating(true)
    await dispatch(updateStatusThunk({ id: selectedApp.id, status: selectedStatus, statusNote: statusNote }))
    setUpdating(false)
    setSelectedApp(null)
    setSelectedStatus('')
    setStatusNote('')
  }

  const handleBulkUpdateStatus = async () => {
    if (selectedApplicants.size === 0 || !bulkStatus) return
    setBulkUpdating(true)
    for (const appId of selectedApplicants) {
      await dispatch(updateStatusThunk({ id: appId, status: bulkStatus, statusNote: bulkNote }))
    }
    setBulkUpdating(false)
    setSelectedApplicants(new Set())
    setBulkStatus('')
    setBulkNote('')
  }

  const handleSelectChange = (id: number, selected: boolean) => {
    const newSelected = new Set(selectedApplicants)
    if (selected) newSelected.add(id)
    else newSelected.delete(id)
    setSelectedApplicants(newSelected)
  }

  const handleSelectAll = (applications: ApplicationResponse[]) => {
    if (selectedApplicants.size === applications.length) {
      setSelectedApplicants(new Set())
    } else {
      setSelectedApplicants(new Set(applications.map((a) => a.id)))
    }
  }

  const sourceApplications = isJobScoped ? jobApplicants : recruiterInbox
  let filtered = filterStatus ? sourceApplications.filter((a) => a.status === filterStatus) : sourceApplications
  
  // Apply search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase()
    filtered = filtered.filter((a) =>
      (a.applicantName?.toLowerCase() || '').includes(query) ||
      (a.applicantEmail?.toLowerCase() || '').includes(query) ||
      (a.applicantPhone?.toLowerCase() || '').includes(query) ||
      (a.jobTitle?.toLowerCase() || '').includes(query)
    )
  }

  const totalPages = isJobScoped ? jobApplicantsTotalPages : recruiterInboxTotalPages

  if (loading && sourceApplications.length === 0) return <PageSpinner />

  return (
    <div className="py-8">
      <div className="page-container">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="section-title mb-1">Applications Inbox</h1>
            <p className="text-body-sm text-slate-500">
              {isJobScoped
                ? `Showing applications for ${selectedJobTitle || `job #${selectedJobId}`}`
                : `${recruiterInboxTotalElements} total applications`}
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, phone, or job title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-10 w-full"
          />
        </div>

        {/* Filter bar */}
        <div className="card p-3 mb-6 flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400 ml-1" />
          {['', 'APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'OFFERED', 'REJECTED'].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-body-xs font-medium transition-all',
                filterStatus === s
                  ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800',
              )}
            >
              {s === '' ? 'All' : STATUS_LABELS[s] || s}
            </button>
          ))}
        </div>

        {/* Bulk Actions Bar */}
        {selectedApplicants.size > 0 && (
          <div className="card p-4 mb-6 border-l-4 border-brand-500 bg-brand-50 dark:bg-brand-900/20">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedApplicants.size === filtered.length && filtered.length > 0}
                  onChange={() => handleSelectAll(filtered)}
                  className="w-4 h-4 cursor-pointer"
                />
                <span className="text-body-sm font-medium text-slate-700 dark:text-slate-300">
                  {selectedApplicants.size} selected
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  className="input-field text-body-sm"
                >
                  <option value="">Update status to...</option>
                  {STATUSES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleBulkUpdateStatus}
                  disabled={!bulkStatus || bulkUpdating}
                  className="btn-primary text-body-xs"
                >
                  {bulkUpdating ? <Spinner size="sm" /> : 'Bulk Update'}
                </button>
                <button
                  onClick={() => setSelectedApplicants(new Set())}
                  className="btn-secondary text-body-xs"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <EmptyState
            title="No applications yet"
            description={searchQuery ? 'No applications match your search.' : 'Applications to your jobs will appear here.'}
            icon={<CheckCircle2 className="w-12 h-12" />}
          />
        ) : (
          <>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map((app) => (
                <ApplicantCard
                  key={app.id}
                  app={app}
                  onUpdateClick={handleUpdateStatusClick}
                  onViewDetailsClick={setDetailedApp}
                  isSelected={selectedApplicants.has(app.id)}
                  onSelectChange={handleSelectChange}
                  showCheckbox={true}
                />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}

        {/* Single Status Update Modal */}
        <Modal
          open={selectedApp !== null}
          onClose={() => {
            setSelectedApp(null)
            setSelectedStatus('')
            setStatusNote('')
          }}
          title="Update Application Status"
        >
          <div className="space-y-4">
            {selectedApp && (
              <>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-4">
                  <p className="text-body-xs text-slate-500 mb-1">Applicant</p>
                  <p className="text-body-sm font-semibold text-slate-900 dark:text-slate-100">{selectedApp.applicantName || 'Applicant'}</p>
                  <p className="text-body-xs text-slate-600 dark:text-slate-400 mt-2">Applied for: <span className="font-medium">{selectedApp.jobTitle}</span></p>
                </div>

                <div>
                  <label className="label mb-3">Update status to:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {STATUSES.map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => setSelectedStatus(value)}
                        className={cn(
                          'flex items-center gap-2 p-3 rounded-xl border text-body-sm font-medium transition-all',
                          selectedStatus === value
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-brand-300 dark:hover:border-brand-600',
                        )}
                      >
                        <Icon className="w-4 h-4" /> {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label">Note to applicant (optional)</label>
                  <textarea
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                    rows={3}
                    placeholder="Add feedback or next steps for the applicant..."
                    className="input-field resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedApp(null)
                      setSelectedStatus('')
                      setStatusNote('')
                    }}
                    className="btn-secondary flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateStatus}
                    disabled={!selectedStatus || updating}
                    className="btn-primary flex-1"
                  >
                    {updating ? <Spinner size="sm" /> : 'Update Status'}
                  </button>
                </div>
              </>
            )}
          </div>
        </Modal>

        {/* Detailed Applicant Modal */}
        <Modal
          open={detailedApp !== null}
          onClose={() => setDetailedApp(null)}
          title={detailedApp?.applicantName || 'Applicant Details'}
          maxWidth="max-w-2xl"
        >
          {detailedApp && (
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-body-xs text-slate-500 mb-1">Email</p>
                  <a href={`mailto:${detailedApp.applicantEmail}`} className="text-body-sm font-medium text-brand-600 hover:underline">
                    {detailedApp.applicantEmail}
                  </a>
                </div>
                <div>
                  <p className="text-body-xs text-slate-500 mb-1">Phone</p>
                  <p className="text-body-sm font-medium">{detailedApp.applicantPhone || '—'}</p>
                </div>
              </div>

              {/* Job Info */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800">
                <p className="text-body-xs text-slate-500 mb-2">Applied for</p>
                <p className="text-body-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">{detailedApp.jobTitle}</p>
                <p className="text-body-sm text-slate-600 dark:text-slate-400">{detailedApp.companyName}</p>
                <p className="text-body-xs text-slate-500 mt-3">Applied {timeAgo(detailedApp.appliedAt)}</p>
                <span className={cn('badge mt-3', STATUS_COLORS[detailedApp.status])}>
                  {STATUS_LABELS[detailedApp.status] || detailedApp.status}
                </span>
              </div>

              {/* Cover Letter */}
              {detailedApp.coverLetter && (
                <div>
                  <p className="text-body-sm font-semibold mb-2">Cover Letter</p>
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg max-h-40 overflow-y-auto">
                    <p className="text-body-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{detailedApp.coverLetter}</p>
                  </div>
                </div>
              )}

              {/* Status Note */}
              {detailedApp.statusNote && (
                <div>
                  <p className="text-body-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Status Note</p>
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                    <p className="text-body-sm text-slate-700 dark:text-slate-300">{detailedApp.statusNote}</p>
                  </div>
                </div>
              )}

              {/* Resume & Job Links */}
              <div className="flex gap-2 flex-wrap">
                {detailedApp.resumeUrl && (
                  <>
                    <a
                      href={detailedApp.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary text-body-xs inline-flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" /> View Resume
                    </a>
                    <a
                      href={detailedApp.resumeUrl}
                      download
                      className="btn-secondary text-body-xs inline-flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Download Resume
                    </a>
                  </>
                )}
                <Link to={`/jobs/${detailedApp.jobId}`} className="btn-secondary text-body-xs inline-flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" /> View Job
                </Link>
              </div>

              {/* Action Button */}
              <button
                onClick={() => {
                  handleUpdateStatusClick(detailedApp)
                  setDetailedApp(null)
                }}
                className="btn-primary w-full"
              >
                Update Status
              </button>
            </div>
          )}
        </Modal>
      </div>
    </div>
  )
}
