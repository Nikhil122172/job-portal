import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../shared/hooks/redux'
import { createJobThunk, updateJobThunk, getJobByIdThunk } from '../../store/slices/jobsSlice'
import { Input, Textarea, Select, Spinner, PageSpinner, Button } from '../../shared/components/ui'
import { ArrowLeft, Briefcase, CheckCircle2 } from 'lucide-react'
import { cn } from '../../shared/utils/helpers'
import toast from 'react-hot-toast'
import type { JobResponse } from '../../core/api/services/jobs'

const jobTypeSchema = z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE'], {
  required_error: 'Please select a job type',
  invalid_type_error: 'Please select a valid job type',
})
const experienceLevelSchema = z.enum(['ENTRY', 'JUNIOR', 'MID', 'SENIOR', 'LEAD'], {
  required_error: 'Please select an experience level',
  invalid_type_error: 'Please select a valid experience level',
})
const currencySchema = z.enum(['USD', 'EUR', 'GBP', 'INR'], {
  required_error: 'Please select a currency',
  invalid_type_error: 'Please select a valid currency',
})

const positiveMoney = z.coerce
  .number({ invalid_type_error: 'Enter a valid salary amount' })
  .nonnegative('Salary cannot be negative')

const optionalPositiveMoney = z.coerce
  .number({ invalid_type_error: 'Enter a valid salary amount' })
  .nonnegative('Salary cannot be negative')
  .optional()

const schema = z.object({
  title: z.string().trim().min(5, 'Job title must be at least 5 characters').max(120, 'Job title must be 120 characters or less'),
  description: z.string().trim().min(80, 'Description must be at least 80 characters').max(4000, 'Description must be 4000 characters or less'),
  company: z.string().trim().min(2, 'Company name is required').max(100, 'Company name must be 100 characters or less'),
  location: z.string().trim().min(2, 'Location is required').max(120, 'Location must be 120 characters or less'),
  jobType: jobTypeSchema,
  experienceLevel: experienceLevelSchema,
  category: z.string().trim().max(80, 'Category must be 80 characters or less').optional().or(z.literal('')),
  skills: z.string().trim().max(500, 'Skills must be 500 characters or less').optional().or(z.literal('')),
  requirements: z.string().trim().max(2000, 'Requirements must be 2000 characters or less').optional().or(z.literal('')),
  responsibilities: z.string().trim().max(2000, 'Responsibilities must be 2000 characters or less').optional().or(z.literal('')),
  salaryMin: positiveMoney,
  salaryMax: optionalPositiveMoney,
  salaryCurrency: currencySchema.default('USD'),
  isRemote: z.boolean().optional(),
  applicationDeadline: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((value) => !value || !Number.isNaN(Date.parse(value)), { message: 'Enter a valid deadline date' })
    .refine((value) => !value || new Date(value).getTime() > Date.now(), { message: 'Deadline must be in the future' }),
})
  .refine((data) => !data.salaryMax || data.salaryMax >= data.salaryMin, {
    message: 'Max salary must be greater than or equal to min salary',
    path: ['salaryMax'],
  })

type FormData = z.infer<typeof schema>

const JOB_TYPES = [
  { value: 'FULL_TIME', label: 'Full Time' },
  { value: 'PART_TIME', label: 'Part Time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'FREELANCE', label: 'Freelance' },
]

const EXP_LEVELS = [
  { value: 'ENTRY', label: 'Entry Level' },
  { value: 'JUNIOR', label: 'Junior' },
  { value: 'MID', label: 'Mid Level' },
  { value: 'SENIOR', label: 'Senior' },
  { value: 'LEAD', label: 'Lead / Principal' },
]

const CATEGORIES = [
  { value: 'Technology', label: 'Technology' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Sales', label: 'Sales' },
  { value: 'Design', label: 'Design' },
  { value: 'Engineering', label: 'Engineering' },
  { value: 'Data Science', label: 'Data Science' },
  { value: 'Human Resources', label: 'Human Resources' },
  { value: 'Operations', label: 'Operations' },
  { value: 'Legal', label: 'Legal' },
  { value: 'Education', label: 'Education' },
  { value: 'Customer Service', label: 'Customer Service' },
  { value: 'General', label: 'General' },
]

export default function PostJobPage() {
  const { id } = useParams<{ id?: string }>()
  const isEdit = !!id
  const location = useLocation()
  const jobFromRouteState = (location.state as { job?: JobResponse } | null)?.job
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { loading, currentJob } = useAppSelector((s) => s.jobs)
  const { user } = useAppSelector((s) => s.auth)
  const prefillJob = currentJob ?? jobFromRouteState
  const lockedCompanyName = isEdit ? (prefillJob?.company || '') : (user?.companyName || '')
  const missingCompanyOnProfile = !isEdit && !user?.companyName
  const submitGuard = useRef(false)
  const buttonClickedRef = useRef(false)
  const [submitLocked, setSubmitLocked] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)

  const { register, handleSubmit, reset, watch, setValue, trigger, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { salaryCurrency: 'USD', isRemote: false },
  })

  const isRemote = watch('isRemote')
  const formValues = watch()

  const steps = [
    { title: 'Basic Info' },
    { title: 'Job Details' },
    { title: 'Compensation' },
    { title: 'Review & Publish' },
  ]

  useEffect(() => {
    if (isEdit && id) dispatch(getJobByIdThunk({ id, incrementViewCount: false }))
  }, [isEdit, id, dispatch])

  useEffect(() => {
    if (lockedCompanyName) {
      setValue('company', lockedCompanyName, { shouldValidate: true })
    }
  }, [lockedCompanyName, setValue])

  useEffect(() => {
    if (isEdit && currentJob) {
      reset({
        title: currentJob.title,
        description: currentJob.description,
        company: currentJob.company,
        location: currentJob.location,
        jobType: currentJob.jobType as FormData['jobType'],
        experienceLevel: currentJob.experienceLevel as FormData['experienceLevel'],
        category: currentJob.category || '',
        skills: currentJob.skills || '',
        requirements: currentJob.requirements || '',
        responsibilities: currentJob.responsibilities || '',
        salaryMin: currentJob.salaryMin,
        salaryMax: currentJob.salaryMax,
        salaryCurrency: (currentJob.salaryCurrency || 'USD') as FormData['salaryCurrency'],
        isRemote: currentJob.isRemote,
      })
    }
  }, [currentJob, isEdit, reset])

  const onSubmit = async (data: FormData) => {
    // Only allow submission if the submit button was explicitly clicked
    if (!buttonClickedRef.current) {
      return
    }
    if (submitGuard.current) return
    if (missingCompanyOnProfile) {
      toast.error('Please set your company name in Profile before posting a job')
      return
    }
    submitGuard.current = true
    setSubmitLocked(true)
    buttonClickedRef.current = false // Reset flag after submission starts

    const payload = {
      ...data,
      applicationDeadline: data.applicationDeadline ? new Date(data.applicationDeadline).toISOString() : undefined,
    }
    try {
      let res
      if (isEdit && id) {
        res = await dispatch(updateJobThunk({ id, data: payload }))
        if (updateJobThunk.fulfilled.match(res)) {
          toast.success('Job updated successfully')
          navigate('/recruiter/jobs')
        } else {
          toast.error((res.payload as string) || 'Failed to update job')
        }
      } else {
        res = await dispatch(createJobThunk(payload))
        if (createJobThunk.fulfilled.match(res)) {
          toast.success('Job posted successfully')
          // Keep recruiter company locked and clear the rest of the form for next post.
          reset({ salaryCurrency: 'USD', isRemote: false, applicationDeadline: '' } as Partial<FormData>)
          if (lockedCompanyName) {
            setValue('company', lockedCompanyName, { shouldValidate: true })
          }
          navigate('/recruiter/jobs', {
            state: {
              feedbackPrompt: true,
              jobTitle: data.title,
            },
          })
        } else {
          toast.error((res.payload as string) || 'Failed to post job')
        }
      }
    } finally {
      submitGuard.current = false
      setSubmitLocked(false)
    }
  }

  const goNext = async () => {
    const fieldsByStep: Array<Array<keyof FormData>> = [
      ['title', 'company', 'location', 'jobType', 'experienceLevel', 'category'],
      ['description', 'requirements', 'responsibilities', 'skills'],
      ['salaryMin', 'salaryMax', 'salaryCurrency', 'applicationDeadline'],
      [],
    ]

    const fields = fieldsByStep[currentStep]
    const valid = fields.length ? await trigger(fields) : true
    if (!valid) {
      toast.error('Please fix the highlighted fields before continuing')
      return
    }
    setCurrentStep((s) => Math.min(s + 1, steps.length - 1))
  }

  const goBack = () => setCurrentStep((s) => Math.max(s - 1, 0))

  const goToStep = (step: number) => {
    if (step <= currentStep) {
      setCurrentStep(step)
    }
  }

  useEffect(() => {
    if (isEdit && jobFromRouteState) {
      reset({
        title: jobFromRouteState.title,
        description: jobFromRouteState.description,
        company: jobFromRouteState.company,
        location: jobFromRouteState.location,
        jobType: jobFromRouteState.jobType as FormData['jobType'],
        experienceLevel: jobFromRouteState.experienceLevel as FormData['experienceLevel'],
        category: jobFromRouteState.category || '',
        skills: jobFromRouteState.skills || '',
        requirements: jobFromRouteState.requirements || '',
        responsibilities: jobFromRouteState.responsibilities || '',
        salaryMin: jobFromRouteState.salaryMin,
        salaryMax: jobFromRouteState.salaryMax,
        salaryCurrency: (jobFromRouteState.salaryCurrency || 'USD') as FormData['salaryCurrency'],
        isRemote: jobFromRouteState.isRemote,
      })
    }
  }, [isEdit, jobFromRouteState, reset])

  if (isEdit && loading && !prefillJob) return <PageSpinner />

  return (
    <div className="py-8">
      <div className="page-container max-w-3xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-body-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-6 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-brand-100 dark:bg-brand-900/40 rounded-xl flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          </div>
          <div>
            <h1 className="section-title text-2xl">{isEdit ? 'Edit Job' : 'Post a New Job'}</h1>
            <p className="text-slate-500 text-body-sm">{isEdit ? 'Update your job listing' : 'Fill in the details to attract great candidates'}</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="grid grid-cols-4 gap-2 mb-3">
            {steps.map((step, index) => {
              const isActive = index === currentStep
              const isCompleted = index < currentStep

              return (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => goToStep(index)}
                  disabled={!isCompleted && !isActive}
                  className={cn(
                    'rounded-lg px-2 py-1.5 text-xs font-semibold transition-all border',
                    isActive
                      ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                      : isCompleted
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed',
                  )}
                >
                  {index + 1}. {step.title}
                </button>
              )
            })}
          </div>
            <div className="flex items-center justify-between text-body-xs text-slate-500 mb-2">
            <span>Step {currentStep + 1} of {steps.length}</span>
            <span>{steps[currentStep].title}</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className={cn(
                'h-full bg-gradient-to-r from-brand-500 to-cyan-500 transition-all duration-300',
                currentStep === 0 && 'w-1/4',
                currentStep === 1 && 'w-2/4',
                currentStep === 2 && 'w-3/4',
                currentStep === 3 && 'w-full',
              )}
            />
          </div>
        </div>

        <form 
          onSubmit={handleSubmit(onSubmit)} 
          onKeyDown={(e) => {
            // Prevent form submission when user presses Enter in input/select fields
            // Only allow form submission via explicit "Post Job" button click
            if (e.key === 'Enter' && e.target instanceof HTMLInputElement && e.target.type !== 'textarea') {
              e.preventDefault()
            }
          }}
          className="space-y-6"
        >
          {currentStep === 0 && (
            <div className="card p-6 space-y-5">
              <h2 className="font-display text-display-lg font-semibold text-slate-700 dark:text-slate-300">Basic Information</h2>
              <Input label="Job Title *" placeholder="e.g. Senior React Developer" error={errors.title?.message} hint="5-120 characters" characterMode="text" {...register('title')} />
              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Company *"
                  placeholder="Company name from recruiter profile"
                  error={errors.company?.message}
                  hint={missingCompanyOnProfile ? 'Set your company name in Profile first. This field is locked.' : 'Auto-filled from recruiter profile and locked.'}
                  readOnly
                  className="bg-slate-50 dark:bg-slate-800/60 cursor-not-allowed"
                  characterMode="text"
                  {...register('company')}
                />
                <Input label="Location *" placeholder="New York, NY or Remote" error={errors.location?.message} characterMode="text" {...register('location')} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Select label="Job Type *" options={JOB_TYPES} placeholder="Select type" error={errors.jobType?.message} {...register('jobType')} />
                <Select label="Experience Level *" options={EXP_LEVELS} placeholder="Select level" error={errors.experienceLevel?.message} {...register('experienceLevel')} />
              </div>
              <Select label="Category" options={CATEGORIES} placeholder="Select category" {...register('category')} />

              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setValue('isRemote', !isRemote)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${isRemote ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-700'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isRemote ? 'translate-x-6' : 'translate-x-1'}`} />
                </div>
                <span className="text-body-sm font-medium text-slate-700 dark:text-slate-300">Remote position</span>
              </label>
            </div>
          )}

          {currentStep === 1 && (
            <div className="card p-6 space-y-4">
              <h2 className="font-display text-display-lg font-semibold text-slate-700 dark:text-slate-300">Job Details</h2>
              <Textarea label="Description *" rows={6} placeholder="Describe the role, team, and what you're looking for..." error={errors.description?.message} hint="At least 80 characters" {...register('description')} />
              <Textarea label="Requirements" rows={4} placeholder="List the key requirements (one per line or comma-separated)" error={errors.requirements?.message} {...register('requirements')} />
              <Textarea label="Responsibilities" rows={4} placeholder="Describe day-to-day responsibilities..." error={errors.responsibilities?.message} {...register('responsibilities')} />
              <Input label="Required Skills" placeholder="React, TypeScript, Node.js, AWS (comma-separated)" error={errors.skills?.message} {...register('skills')} />
            </div>
          )}

          {currentStep === 2 && (
            <div className="card p-6 space-y-4">
              <h2 className="font-display text-display-lg font-semibold text-slate-700 dark:text-slate-300">Compensation & Timeline</h2>
              <p className="text-body-xs text-slate-500">Specify minimum salary. Maximum salary is optional - leave empty if you prefer not to set an upper limit.</p>
              <div className="grid sm:grid-cols-3 gap-4">
                <Input label="Min Salary *" type="text" characterMode="numeric" placeholder="50000" error={errors.salaryMin?.message} {...register('salaryMin')} />
                <Input label="Max Salary" type="text" characterMode="numeric" placeholder="80000" error={errors.salaryMax?.message} {...register('salaryMax')} />
                <Select label="Currency" options={[
                  { value: 'USD', label: 'USD ($)' },
                  { value: 'EUR', label: 'EUR (€)' },
                  { value: 'GBP', label: 'GBP (£)' },
                  { value: 'INR', label: 'INR (₹)' },
                ]} error={errors.salaryCurrency?.message} {...register('salaryCurrency')} />
              </div>
              <Input label="Application Deadline" type="date" error={errors.applicationDeadline?.message} hint="Optional, must be a future date" {...register('applicationDeadline')} />
            </div>
          )}

          {currentStep === 3 && (
            <div className="card p-6 space-y-5">
              <h2 className="font-display text-display-lg font-semibold text-slate-700 dark:text-slate-300">Review Before Publish</h2>
              <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
                <p className="font-semibold text-slate-900 dark:text-slate-100 text-body-sm">{formValues.title}</p>
                <p className="text-body-sm text-slate-500">{formValues.company} - {formValues.location}</p>
                <p className="text-body-sm text-slate-600 dark:text-slate-300 line-clamp-4">{formValues.description}</p>
                <div className="flex flex-wrap gap-2 text-body-xs">
                  <span className="badge-blue">{formValues.jobType?.replace('_', ' ')}</span>
                  <span className="badge-green">{formValues.experienceLevel}</span>
                  {formValues.category && <span className="badge">{formValues.category}</span>}
                  {formValues.isRemote && <span className="badge">Remote</span>}
                </div>
                <div className="text-body-sm text-slate-600 dark:text-slate-300">
                  Salary: {formValues.salaryMin ?? 'N/A'}{formValues.salaryMax ? ` - ${formValues.salaryMax}` : ''} {formValues.salaryCurrency || 'USD'}
                </div>
                {formValues.applicationDeadline && (
                  <div className="text-body-sm text-slate-600 dark:text-slate-300">Deadline: {formValues.applicationDeadline}</div>
                )}
              </div>
              <p className="text-body-sm text-emerald-600 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Looks good. Publish when ready.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            {currentStep === 0 ? (
              <Button type="button" variant="secondary" onClick={() => navigate(-1)} className="flex-1 sm:flex-none sm:px-8">
                Cancel
              </Button>
            ) : (
              <Button type="button" variant="secondary" onClick={goBack} className="flex-1 sm:flex-none sm:px-8">
                Back
              </Button>
            )}

            {currentStep < steps.length - 1 ? (
              <Button type="button" onClick={goNext} disabled={missingCompanyOnProfile} className="flex-1 py-3 text-base">
                Continue
              </Button>
            ) : (
              <Button 
                type="submit" 
                onClick={() => { buttonClickedRef.current = true }}
                disabled={loading || missingCompanyOnProfile || submitLocked || isSubmitting} 
                className="flex-1 py-3 text-base"
              >
                {(loading || submitLocked || isSubmitting)
                  ? <><Spinner size="sm" />{isEdit ? ' Saving...' : ' Posting...'}</>
                  : (isEdit ? 'Save Changes' : 'Post Job')}
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
