import { useState } from 'react'
import type React from 'react'
import { ChevronDown, Download } from 'lucide-react'
import { ApplicantTableRow } from './ApplicantTableRow'
import type { ApplicationResponse } from '../../core/api/services'

interface JobGroupSectionProps {
  jobId: number
  jobTitle: string
  companyName: string
  applicants: ApplicationResponse[]
  onWithdraw: (id: number) => void
}

export const JobGroupSection: React.FC<JobGroupSectionProps> = (props: JobGroupSectionProps) => {
  const { jobTitle, companyName, applicants, onWithdraw } = props
  const [isExpanded, setIsExpanded] = useState(true)

  const handleExportCSV = () => {
    if (applicants.length === 0) return

    // CSV headers
    const headers = ['Applicant Name', 'Email', 'Phone', 'Status', 'Applied Date', 'Resume URL']

    // CSV rows
    const rows = applicants.map((app: ApplicationResponse) => [
      app.applicantName || 'Anonymous',
      app.applicantEmail || '',
      app.applicantPhone || '',
      app.status || '',
      new Date(app.appliedAt).toLocaleDateString(),
      app.resumeUrl || '',
    ])

    // Combine and create CSV string
    const csvContent = [headers, ...rows].map((row: any) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n')

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)

    link.setAttribute('href', url)
    link.setAttribute('download', `${jobTitle.replace(/\s+/g, '_')}_applicants_${new Date().toLocaleDateString()}.csv`)
    link.style.visibility = 'hidden'

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="mb-6 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      {/* Job Header */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 px-6 py-4 flex items-center justify-between cursor-pointer hover:from-slate-100 dark:hover:from-slate-600 transition-colors" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <ChevronDown
              className={`w-5 h-5 text-slate-500 dark:text-slate-400 transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
            />
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">{jobTitle}</h3>
              <p className="text-body-xs text-slate-600 dark:text-slate-400">{companyName}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="badge badge-secondary text-body-xs">{applicants.length} applicant{applicants.length !== 1 ? 's' : ''}</span>
          <button
            onClick={(e: any) => {
              e.stopPropagation()
              handleExportCSV()
            }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-body-xs font-medium bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
            title="Export as CSV"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Applicants Table */}
      {isExpanded && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100/50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3 text-left text-body-xs font-semibold text-slate-700 dark:text-slate-300">Applicant</th>
                <th className="px-4 py-3 text-left text-body-xs font-semibold text-slate-700 dark:text-slate-300">Phone</th>
                <th className="px-4 py-3 text-left text-body-xs font-semibold text-slate-700 dark:text-slate-300">Status</th>
                <th className="px-4 py-3 text-left text-body-xs font-semibold text-slate-700 dark:text-slate-300">Applied</th>
                <th className="px-4 py-3 text-left text-body-xs font-semibold text-slate-700 dark:text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applicants.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-body-sm text-slate-500">
                    No applicants yet
                  </td>
                </tr>
              ) : (
                applicants.map((app) => <ApplicantTableRow key={app.id} app={app} onWithdraw={onWithdraw} />)
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
