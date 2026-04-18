import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAppDispatch, useAppSelector } from '../../shared/hooks/redux'
import { logout, setUser, updateProfileThunk } from '../../store/slices/authSlice'
import { authApi } from '../../core/api/services'
import { Input, Textarea, Spinner, Avatar } from '../../shared/components/ui'
import { Camera, Shield, User } from 'lucide-react'
import { cn, formatDate } from '../../shared/utils/helpers'
import toast from 'react-hot-toast'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Full name is required').max(100, 'Full name cannot exceed 100 characters'),
  phoneNumber: z.string().regex(/^\d{10}$/, 'Phone number must be exactly 10 digits'),
  bio: z.string().max(500, 'Bio max 500 chars').optional(),
  location: z.string().max(100, 'Location cannot exceed 100 characters').optional(),
  companyName: z.string().max(120, 'Company name cannot exceed 120 characters').optional(),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .refine((value) => /[A-Z]/.test(value), { message: 'New password must include at least one uppercase letter' })
    .refine((value) => /[0-9]/.test(value), { message: 'New password must include at least one number' })
    .refine((value) => /[^A-Za-z0-9]/.test(value), { message: 'New password must include at least one special character' }),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match', path: ['confirmPassword'],
})

type ProfileForm = z.infer<typeof profileSchema>
type PasswordForm = z.infer<typeof passwordSchema>

export default function ProfilePage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { user, loading } = useAppSelector((s) => s.auth)
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile')
  const [uploadingImg, setUploadingImg] = useState(false)
  const [changingPass, setChangingPass] = useState(false)

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      phoneNumber: user?.phoneNumber || '',
      bio: user?.bio || '',
      location: user?.location || '',
      companyName: user?.companyName || '',
    },
  })

  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) })

  const getApiErrorMessage = (error: unknown, fallback: string) => {
    const err = error as { response?: { data?: { message?: string } } }
    return err?.response?.data?.message || fallback
  }

  const onProfileSubmitWithFeedback = async (data: ProfileForm) => {
    const res = await dispatch(updateProfileThunk(data))
    if (updateProfileThunk.rejected.match(res)) {
      toast.error((res.payload as string) || 'Unable to save profile changes')
    }
  }

  const onPasswordSubmit = async (data: PasswordForm) => {
    setChangingPass(true)
    try {
      await authApi.changePassword(data.currentPassword, data.newPassword)
      toast.success('Password changed successfully!')
      dispatch(logout())
      navigate('/login', { replace: true })
      passwordForm.reset()
    } catch {
      toast.error('Incorrect current password')
    } finally {
      setChangingPass(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImg(true)
    try {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload JPG, PNG, or WEBP image files only')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB')
        return
      }
      const res = await authApi.uploadProfileImage(file)
      dispatch(setUser(res.data))
      toast.success('Profile image updated!')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to upload image'))
    } finally {
      setUploadingImg(false)
    }
  }

  if (!user) return null

  const TABS = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
  ] as const

  return (
    <div className="py-8">
      <div className="page-container max-w-3xl">
        <h1 className="section-title mb-2">Account Settings</h1>
        <p className="text-slate-500 text-sm mb-8">Manage your profile and account preferences</p>

        {/* Profile header */}
        <div className="card group relative overflow-hidden p-6 mb-6 border border-slate-100/80 dark:border-slate-800/80">
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-500 via-cyan-500 to-indigo-500" />
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-brand-500/10 blur-2xl opacity-70" />
          <div className="flex items-center gap-5">
            <div className="relative">
              <Avatar name={user.fullName} src={user.profileImageUrl} size="xl" />
              <label className={cn(
                'absolute bottom-0 right-0 w-7 h-7 bg-brand-600 hover:bg-brand-700 rounded-full flex items-center justify-center cursor-pointer transition-colors shadow',
                uploadingImg && 'opacity-70 cursor-wait',
              )}>
                {uploadingImg ? <Spinner size="sm" className="text-white" /> : <Camera className="w-3.5 h-3.5 text-white" />}
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImg} />
              </label>
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold">{user.fullName}</h2>
              <p className="text-slate-500 text-sm">{user.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="badge-blue">{user.role?.replace('_', ' ')}</span>
                {user.isActive && <span className="badge-green">Active</span>}
              </div>
            </div>
            <div className="ml-auto text-right hidden sm:block">
              <p className="text-xs text-slate-400">Member since</p>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatDate(user.createdAt)}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl mb-6 border border-slate-200/70 dark:border-slate-700/70">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
                activeTab === id
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200',
              )}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {activeTab === 'profile' && (
          <div className="card p-6 animate-fade-in border border-slate-100/80 dark:border-slate-800/80">
            <h3 className="font-semibold mb-5">Personal Information</h3>
            <form onSubmit={profileForm.handleSubmit(onProfileSubmitWithFeedback)} className="space-y-4">
              <Input label="Full Name" error={profileForm.formState.errors.fullName?.message} characterMode="text" {...profileForm.register('fullName')} />
              <Input
                label="Phone Number"
                type="text"
                characterMode="numeric"
                maxLength={10}
                placeholder="1234567890"
                error={profileForm.formState.errors.phoneNumber?.message}
                {...profileForm.register('phoneNumber')}
              />
              <Input label="Location" placeholder="City, Country" characterMode="text" error={profileForm.formState.errors.location?.message} {...profileForm.register('location')} />
              {user.role === 'RECRUITER' && (
                <Input label="Company Name" characterMode="text" error={profileForm.formState.errors.companyName?.message} {...profileForm.register('companyName')} />
              )}
              <Textarea
                label="Bio"
                rows={4}
                placeholder="Tell us about yourself..."
                error={profileForm.formState.errors.bio?.message}
                {...profileForm.register('bio')}
              />
              <button type="submit" disabled={loading || profileForm.formState.isSubmitting} className="btn-primary px-8 py-2.5">
                {(loading || profileForm.formState.isSubmitting) ? <><Spinner size="sm" /> Saving profile...</> : 'Save Profile Changes'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="card p-6 animate-fade-in border border-slate-100/80 dark:border-slate-800/80">
            <h3 className="font-semibold mb-5">Change Password</h3>
            <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                error={passwordForm.formState.errors.currentPassword?.message}
                {...passwordForm.register('currentPassword')}
              />
              <Input
                label="New Password"
                type="password"
                error={passwordForm.formState.errors.newPassword?.message}
                hint="At least 8 characters, one uppercase, one number, and one special character"
                {...passwordForm.register('newPassword')}
              />
              <Input
                label="Confirm New Password"
                type="password"
                error={passwordForm.formState.errors.confirmPassword?.message}
                {...passwordForm.register('confirmPassword')}
              />
              <button type="submit" disabled={changingPass || passwordForm.formState.isSubmitting} className="btn-primary px-8 py-2.5">
                {(changingPass || passwordForm.formState.isSubmitting) ? <><Spinner size="sm" /> Updating password...</> : 'Update Password'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
