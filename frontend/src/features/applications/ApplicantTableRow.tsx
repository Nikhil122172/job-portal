import { useState } from 'react'
import { Clock, FileText, AlertTriangle } from 'lucide-react'
import { Modal } from '../../shared/components/ui'
import { timeAgo, STATUS_COLORS, cn } from '../../shared/utils/helpers'
import type { ApplicationResponse } from '../../core/api/services'

const STATUS_ICONS: Record<string, React.ReactNode> = {
  APPLIED: <Clock className="w-4 h-4" />,
  UNDER_REVIEW: <FileText className="w-4 h-4" />,
  SHORTLISTED: <span className="w-4 h-4 text-xs font-bold">✓</span>,
  INTERVIEW_SCHEDULED: <span className="w-4 h-4 text-xs font-bold">✓</span>,
  OFFERED: <span className="w-4 h-4 text-xs font-bold">★</span>,
  REJECTED: <span className="w-4 h-4 text-xs font-bold">✕</span>,
  WITHDRAWN: <span className="w-4 h-4 text-xs font-bold">✕</span>,
}

const STATUS_LABELS: Record<string, string> = {
  APPLIED: 'Applied',
  UNDER_REVIEW: 'Under Review',
  SHORTLISTED: 'Shortlisted',
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  OFFERED: 'Offered',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
}

interface ApplicantTableRowProps {
  app: ApplicationResponse
  onWithdraw: (id: number) => void
}

export const ApplicantTableRow: React.FC<ApplicantTableRowProps> = ({ app, onWithdraw }) => {
  const [withdrawConfirm, setWithdrawConfirm] = useState(false)

  return (
    <>
      <tr className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
        <td className="px-4 py-3 text-body-sm">
          <div>
            <p className="font-medium text-slate-900 dark:text-slate-100">{app.applicantName || 'Anonymous'}</p>
            <p className="text-body-xs text-slate-500">{app.applicantEmail}</p>
          </div>
        </td>
        <td className="px-4 py-3 text-body-sm">
          <div className="flex flex-col">
            <p className="text-slate-600 dark:text-slate-400">{app.applicantPhone || '—'}</p>
          </div>
        </td>
        <td className="px-4 py-3 text-body-sm">
          <div className={cn('badge inline-flex items-center gap-1 shadow-sm w-fit', STATUS_COLORS[app.status])}>
            {STATUS_ICONS[app.status]}
            {STATUS_LABELS[app.status] || app.status}
          </div>
        </td>
        <td className="px-4 py-3 text-body-xs text-slate-500">
          <span className="inline-flex items-center gap-1 bg-white/70 dark:bg-slate-800/70 px-2.5 py-1.5 rounded-full border border-slate-100 dark:border-slate-700">
            <Clock className="w-3 h-3" /> {timeAgo(app.appliedAt)}
          </span>
        </td>
        <td className="px-4 py-3 text-body-sm">
          <div className="flex items-center gap-2">
            {app.resumeUrl && (
              <a
                href={app.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium transition-colors"
                title="View Resume"
              >
                <FileText className="w-4 h-4" />
              </a>
            )}
            {app.status === 'APPLIED' && (
              <button
                onClick={() => setWithdrawConfirm(true)}
                className="text-red-500 hover:text-red-700 transition-colors font-medium text-body-xs"
                title="Withdraw Application"
              >
                Withdraw
              </button>
            )}
          </div>
        </td>
      </tr>

      {app.statusNote && (
        <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/30 dark:bg-slate-800/20">
          <td colSpan={5} className="px-4 py-2">
            <p className="text-body-xs text-slate-600 dark:text-slate-400 italic">
              <span className="font-medium">Note:</span> {app.statusNote}
            </p>
          </td>
        </tr>
      )}

      <Modal
        open={withdrawConfirm}
        onClose={() => setWithdrawConfirm(false)}
        title="Withdraw Application"
      >
        <div className="text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
            <AlertTriangle className="w-7 h-7 text-orange-500" />
          </div>
          <p className="text-body-sm text-slate-600 dark:text-slate-400">
            Are you sure you want to withdraw your application for <strong>{app.jobTitle}</strong>?
          </p>
          <div className="flex gap-3">
            <button onClick={() => setWithdrawConfirm(false)} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={() => {
                onWithdraw(app.id)
                setWithdrawConfirm(false)
              }}
              className="btn-danger flex-1"
            >
              Withdraw
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
