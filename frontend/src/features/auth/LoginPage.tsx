import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../shared/hooks/redux'
import { loginThunk } from '../../store/slices/authSlice'
import { Button, Input, Spinner } from '../../shared/components/ui'
import { Briefcase, Eye, EyeOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { cn } from '../../shared/utils/helpers'

const schema = z.object({
  email: z.string().trim().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required').max(128, 'Password is too long'),
})
type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { loading } = useAppSelector((s) => s.auth)
  const [showPass, setShowPass] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [registrationSuccessMessage, setRegistrationSuccessMessage] = useState<string | null>(
    (location.state as { registrationSuccessMessage?: string })?.registrationSuccessMessage || null,
  )

  useEffect(() => {
    if (!registrationSuccessMessage) {
      return undefined
    }

    const timeoutId = window.setTimeout(() => {
      setRegistrationSuccessMessage(null)
    }, 5000)

    return () => window.clearTimeout(timeoutId)
  }, [registrationSuccessMessage])

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    setLoginError(null)
    const res = await dispatch(loginThunk(data))
    if (loginThunk.fulfilled.match(res)) {
      navigate('/', { replace: true })
      return
    }

    if (loginThunk.rejected.match(res)) {
      const errorMessage = (res.payload as string) || 'Invalid username or password'
      if (errorMessage === 'User not found') {
        setLoginError('User not found. Redirecting to register page...')
        window.setTimeout(() => {
          navigate(`/register?email=${encodeURIComponent(data.email)}`, { replace: true })
        }, 1200)
        return
      }

      setLoginError(errorMessage)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col w-1/2 bg-gradient-to-br from-slate-950 via-violet-950 to-cyan-950 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh-gradient opacity-40" />
        <div className="absolute top-16 left-10 w-40 h-40 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="absolute bottom-10 right-16 w-56 h-56 rounded-full bg-fuchsia-500/15 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-400 to-brand-600 rounded-xl flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-display-lg font-semibold text-white">CareerBridge</span>
          </div>
        </div>
        <div className="relative flex-1 flex items-center">
          <div className="max-w-lg">
            <blockquote className="font-display text-display-2xl font-medium text-white leading-snug mb-6">
              "Your path to career success starts here."
            </blockquote>
            <div className="grid grid-cols-3 gap-4">
              {[['10K+', 'Active Jobs'], ['50K+', 'Candidates'], ['5K+', 'Companies']].map(([n, l], idx) => (
                <div key={l} className={cn('rounded-2xl p-4 border border-white/10 backdrop-blur', idx === 0 && 'bg-white/8', idx === 1 && 'bg-cyan-500/10', idx === 2 && 'bg-fuchsia-500/10')}>
                  <p className="text-2xl font-bold text-brand-300">{n}</p>
                  <p className="text-sm text-slate-400">{l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-gradient-to-br from-slate-50 via-white to-violet-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900">
        <div className="w-full max-w-md animate-slide-up">
          <div className="mb-8">
            <h1 className="font-display text-display-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Welcome back</h1>
            <p className="text-slate-500">Sign in to your CareerBridge account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {registrationSuccessMessage && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700" role="status" aria-live="polite">
                {registrationSuccessMessage}
              </div>
            )}

            {loginError && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert" aria-live="polite">
                {loginError}
              </div>
            )}

            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              hint="Use the email address linked to your account"
              {...register('email')}
            />
            <Input
              label="Password"
              type={showPass ? 'text' : 'password'}
              placeholder="Password"
              error={errors.password?.message}
              hint="Password is case-sensitive"
              rightIcon={(
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-200"
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              )}
              {...register('password')}
            />

            <Button type="submit" disabled={loading} className="w-full shadow-lg shadow-violet-500/15" size="lg">
              {loading ? <><Spinner size="sm" /> Signing in...</> : 'Sign in'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-600 font-medium hover:underline">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
