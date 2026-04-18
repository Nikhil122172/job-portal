import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../shared/hooks/redux'
import { registerThunk } from '../../store/slices/authSlice'
import { authApi } from '../../core/api/services'
import { Button, Input, Spinner } from '../../shared/components/ui'
import { Briefcase, Eye, EyeOff, User, Building2, CheckCircle2 } from 'lucide-react'
import { cn } from '../../shared/utils/helpers'
import toast from 'react-hot-toast'

const strongPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .refine((value) => /[A-Z]/.test(value), { message: 'Password must include at least one uppercase letter' })
  .refine((value) => /[0-9]/.test(value), { message: 'Password must include at least one number' })
  .refine((value) => /[^A-Za-z0-9]/.test(value), { message: 'Password must include at least one special character' })

const schema = z.object({
  role: z.enum(['JOB_SEEKER', 'RECRUITER'], { required_error: 'Please choose your account type' }),
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100, 'Full name cannot exceed 100 characters'),
  username: z.string().trim().min(3, 'Username must be at least 3 characters').max(50, 'Username cannot exceed 50 characters'),
  email: z.string().trim().min(1, 'Email is required').email('Please enter a valid email address'),
  password: strongPasswordSchema,
  phoneNumber: z.string().trim().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
  companyName: z.string().trim().max(120, 'Company name cannot exceed 120 characters').optional(),
  otp: z.string().trim().regex(/^\d{6}$/, 'OTP must be exactly 6 digits').optional().or(z.literal('')),
}).refine((d) => d.role !== 'RECRUITER' || !!d.companyName, {
  message: 'Company name is required for recruiters',
  path: ['companyName'],
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { loading } = useAppSelector((s) => s.auth)
  const [showPass, setShowPass] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [otpCooldown, setOtpCooldown] = useState(0)
  const [currentStep, setCurrentStep] = useState(0)

  const { register, handleSubmit, watch, setValue, getValues, trigger, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'JOB_SEEKER' },
  })

  const role = watch('role')
  const email = watch('email')
  const otp = watch('otp')

  const extractErrorMessage = (error: unknown, fallback: string) => {
    const err = error as { response?: { data?: { message?: string } } }
    return err?.response?.data?.message || fallback
  }

  const steps = [
    { title: 'Identity', fields: ['role', 'fullName', 'username'] as const },
    { title: 'Verify Email', fields: ['email', 'password'] as const },
    { title: 'Profile Info', fields: ['phoneNumber', 'companyName'] as const },
  ]

  useEffect(() => {
    const emailFromQuery = new URLSearchParams(location.search).get('email')?.trim()
    if (emailFromQuery && /\S+@\S+\.\S+/.test(emailFromQuery)) {
      setValue('email', emailFromQuery, { shouldValidate: true })
    }
  }, [location.search, setValue])

  useEffect(() => {
    setOtpSent(false)
    setOtpVerified(false)
    setOtpCooldown(0)
    setValue('otp', '')
  }, [email, setValue])

  useEffect(() => {
    if (otpCooldown <= 0) {
      return undefined
    }

    const timer = window.setInterval(() => {
      setOtpCooldown((current) => Math.max(current - 1, 0))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [otpCooldown])

  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const sendOtp = async () => {
    const validEmail = await trigger('email')
    if (!validEmail) {
      toast.error('Enter a valid email address before requesting OTP')
      return
    }
    setOtpLoading(true)
    try {
      await authApi.sendOtp(email)
      setOtpSent(true)
      setOtpVerified(false)
      setOtpCooldown(120)
      toast.success('OTP sent to your email!')
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Failed to send OTP'))
    } finally {
      setOtpLoading(false)
    }
  }

  const verifyOtp = async () => {
    if (!otpSent) {
      toast.error('Please request OTP first')
      return
    }

    const validOtp = await trigger('otp')
    if (!validOtp) {
      toast.error('Enter a valid 6-digit OTP')
      return
    }

    const otpValue = otp || ''

    try {
      await authApi.verifyOtp(email, otpValue)
      setOtpVerified(true)
      toast.success('Email verified!')
    } catch (error) {
      toast.error(extractErrorMessage(error, 'Invalid OTP'))
    }
  }

  const onSubmit = async (data: FormData) => {
    if (!otpVerified) {
      toast.error('Please verify your email with OTP before creating an account')
      return
    }
    const res = await dispatch(registerThunk(data))
    if (registerThunk.fulfilled.match(res)) {
      navigate(`/login?email=${encodeURIComponent(data.email)}`, {
        replace: true,
        state: {
          registrationSuccessMessage: 'Registration successful. Please login to continue.',
        },
      })
    }
    if (registerThunk.rejected.match(res)) {
      toast.error((res.payload as string) || 'Unable to create your account. Please try again.')
    }
  }

  const goNext = async () => {
    if (currentStep === 0) {
      const valid = await trigger(steps[0].fields)
      if (!valid) {
        toast.error('Please fix the highlighted fields before continuing')
        return
      }
      setCurrentStep(1)
      return
    }

    if (currentStep === 1) {
      const valid = await trigger(steps[1].fields)
      if (!valid) {
        toast.error('Please fix the highlighted fields before continuing')
        return
      }
      if (!otpVerified) {
        toast.error('Please verify your email OTP before continuing')
        return
      }
      setCurrentStep(2)
    }
  }

  const goBack = () => setCurrentStep((s) => Math.max(s - 1, 0))

  const submitFinalStep = async () => {
    const phoneNumber = getValues('phoneNumber')?.trim() || ''
    const companyName = getValues('companyName')?.trim() || ''

    if (!/^\d{10}$/.test(phoneNumber)) {
      toast.error('Phone number must be exactly 10 digits')
      return
    }

    if (role === 'RECRUITER' && !companyName) {
      toast.error('Company name is required for recruiters')
      return
    }

    if (!otpVerified) {
      toast.error('Please verify your email with OTP before creating an account')
      return
    }

    void handleSubmit(onSubmit)()
  }

  const goToStep = (step: number) => {
    if (step <= currentStep) {
      setCurrentStep(step)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-5/12 bg-gradient-to-br from-slate-950 via-violet-950 to-cyan-950 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh-gradient opacity-40" />
        <div className="absolute top-16 right-10 w-44 h-44 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute bottom-12 left-12 w-56 h-56 rounded-full bg-amber-500/15 blur-3xl" />
        <div className="relative flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-display-lg font-semibold text-white">CareerBridge</span>
        </div>
        <div className="relative flex-1 flex items-center">
          <div className="space-y-6 max-w-md">
          <h2 className="font-display text-display-2xl font-medium text-white leading-snug">
            Build your career with CareerBridge
          </h2>
          <div className="space-y-3">
            {['Free account - no credit card', 'Apply to thousands of jobs', 'Get notified on application updates'].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-brand-400 flex-shrink-0" />
                <span className="text-slate-300 text-sm">{f}</span>
              </div>
            ))}
          </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-gradient-to-br from-slate-50 via-white to-violet-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 overflow-y-auto">
        <div className="w-full max-w-md animate-slide-up py-8">
          <div className="mb-6">
            <h1 className="font-display text-display-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Create account</h1>
            <p className="text-slate-500 text-sm">Join CareerBridge - it's free</p>
          </div>

          {/* Role Toggle */}
          <div className="grid grid-cols-2 gap-2 mb-6 p-1 bg-slate-100/90 dark:bg-slate-800/90 rounded-2xl border border-white/60 dark:border-slate-700 shadow-sm">
            {[
              { value: 'JOB_SEEKER', label: 'Job Seeker', Icon: User },
              { value: 'RECRUITER', label: 'Recruiter', Icon: Building2 },
            ].map(({ value, label, Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setValue('role', value as 'JOB_SEEKER' | 'RECRUITER')}
                className={cn(
                  'flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
                  role === value
                    ? 'bg-white dark:bg-slate-700 text-violet-700 dark:text-violet-300 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          <div className="mb-6">
            <div className="grid grid-cols-3 gap-2 mb-3">
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
                      'rounded-xl px-3 py-2 text-label font-semibold transition-all border',
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
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{steps[currentStep].title}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className={cn(
                  'h-full bg-gradient-to-r from-brand-500 to-cyan-500 transition-all duration-300',
                  currentStep === 0 && 'w-1/3',
                  currentStep === 1 && 'w-2/3',
                  currentStep === 2 && 'w-full',
                )}
              />
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {currentStep === 0 && (
              <>
                <Input label="Full Name" placeholder="Jane Doe" error={errors.fullName?.message} characterMode="text" {...register('fullName')} />
                <Input label="Username" placeholder="janedoe" error={errors.username?.message} hint="3-50 characters" {...register('username')} />
              </>
            )}

            {currentStep === 1 && (
              <>
                <div>
                  <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                    <div className="min-w-0">
                      <Input
                        label="Email address"
                        type="email"
                        placeholder="jane@example.com"
                        error={errors.email?.message}
                        hint="We'll send a 6-digit OTP to this email"
                        {...register('email')}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={sendOtp}
                      disabled={otpLoading || otpVerified || otpCooldown > 0}
                      variant="secondary"
                      size="sm"
                      className="h-[46px] w-full whitespace-nowrap md:w-auto"
                    >
                      {otpLoading ? (
                        <Spinner size="sm" />
                      ) : otpVerified ? (
                        <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Verified</span>
                      ) : otpCooldown > 0 ? (
                        `Resend in ${formatCountdown(otpCooldown)}`
                      ) : otpSent ? (
                        'Resend OTP'
                      ) : (
                        'Send OTP'
                      )}
                    </Button>
                  </div>
                  {otpSent && !otpVerified && (
                    <div className="flex gap-2 mt-2">
                      <Input
                        characterMode="numeric"
                        placeholder="6-digit OTP"
                        maxLength={6}
                        className="flex-1"
                        error={errors.otp?.message}
                        hint="Enter the OTP sent to your email"
                        {...register('otp')}
                      />
                      <Button type="button" onClick={verifyOtp} size="sm" className="h-[46px] px-4">Verify OTP</Button>
                    </div>
                  )}
                  {otpVerified && (
                    <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Email verified
                    </p>
                  )}
                </div>

                <Input
                  label="Password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  error={errors.password?.message}
                  rightIcon={(
                    <button type="button" onClick={() => setShowPass(!showPass)} className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200" aria-label={showPass ? 'Hide password' : 'Show password'}>
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                  hint="Use at least 8 characters with uppercase, number, and special character"
                  {...register('password')}
                />
              </>
            )}

            {currentStep === 2 && (
              <>
                <Input
                  label="Mobile Number"
                  type="text"
                  characterMode="numeric"
                  maxLength={10}
                  placeholder="1234567890"
                  error={errors.phoneNumber?.message}
                  {...register('phoneNumber')}
                />

                {role === 'RECRUITER' && (
                  <Input
                    label="Company Name"
                    placeholder="Acme Corp"
                    error={errors.companyName?.message}
                    characterMode="text"
                    {...register('companyName')}
                  />
                )}
              </>
            )}

            <div className="flex gap-3 pt-2">
              {currentStep > 0 && (
                <Button type="button" variant="secondary" onClick={goBack} className="flex-1" size="lg">
                  Back
                </Button>
              )}

              {currentStep < steps.length - 1 ? (
                <Button type="button" onClick={goNext} className="flex-1" size="lg">
                  Continue
                </Button>
              ) : (
                <Button type="button" onClick={submitFinalStep} disabled={loading} className="flex-1" size="lg">
                  {loading ? <><Spinner size="sm" /> Creating account...</> : 'Create Account'}
                </Button>
              )}
            </div>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
