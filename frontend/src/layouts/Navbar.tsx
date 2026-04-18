import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../shared/hooks/redux'
import { logout } from '../store/slices/authSlice'
import { toggleDarkMode } from '../store/slices/uiSlice'
import { clearAllNotifications, fetchMyNotificationsThunk, markAllAsRead, markAsRead, removeNotification } from '../store/slices/notificationsSlice'
import { notificationsApi } from '../core/api/services'
import { getAccessToken } from '../core/api/axios'
import { Avatar, Button } from '../shared/components/ui'
import { Briefcase, Moon, Sun, Bell, Menu, X, ChevronDown, LogOut, User, LayoutDashboard, Plus, Trash2, CheckCheck } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { cn } from '../shared/utils/helpers'

export default function Navbar() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, isAuthenticated } = useAppSelector((s) => s.auth)
  const { darkMode } = useAppSelector((s) => s.ui)
  const { items: notifications, loading: notificationsLoading } = useAppSelector((s) => s.notifications)
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropOpen, setDropOpen] = useState(false)
  const [notificationOpen, setNotificationOpen] = useState(false)
  const dropRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length
  const dashboardHref = user?.role === 'ADMIN'
    ? '/dashboard/admin'
    : user?.role === 'RECRUITER'
      ? '/dashboard/recruiter'
      : '/dashboard/job-seeker'

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropOpen(false)
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) setNotificationOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !user) return

    // Initial fetch of notifications
    dispatch(fetchMyNotificationsThunk({ page: 0, size: 20 }))

    // Use polling as primary method for better reliability
    // Poll every 3 seconds for new notifications
    const pollInterval = setInterval(() => {
      dispatch(fetchMyNotificationsThunk({ page: 0, size: 20 }))
    }, 3000)

    // Bonus: Try SSE for real-time updates without the polling overhead when it works
    const token = getAccessToken()
    let stream: EventSource | null = null
    
    if (token) {
      try {
        stream = notificationsApi.subscribeToMyNotifications(token)
        
        stream.addEventListener('notification', () => {
          // Refresh notifications when we get an SSE event
          dispatch(fetchMyNotificationsThunk({ page: 0, size: 20 }))
        })

        stream.addEventListener('error', (err) => {
          console.warn('Notification stream connection error:', err)
          if (stream) {
            stream.close()
            stream = null
          }
        })

        stream.onopen = () => {
          console.log('Notification stream connected')
        }
      } catch (err) {
        console.warn('Failed to connect notification stream:', err)
      }
    }

    return () => {
      clearInterval(pollInterval)
      if (stream) {
        stream.close()
      }
    }
  }, [dispatch, isAuthenticated, user])

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  const isActive = (path: string) => location.pathname === path

  const navLinks = isAuthenticated
    ? [
        { label: 'Dashboard', href: dashboardHref },
        { label: 'Jobs', href: '/jobs' },
        ...(user?.role === 'RECRUITER' ? [
          { label: 'Post a Job', href: '/recruiter/post-job' },
          { label: 'My Jobs', href: '/recruiter/jobs' },
          { label: 'Applications', href: '/recruiter/applications' },
        ] : []),
        ...(user?.role === 'JOB_SEEKER' ? [
          { label: 'My Applications', href: '/applications' },
        ] : []),
        ...(user?.role === 'ADMIN' ? [
          { label: 'Admin', href: '/admin' },
        ] : []),
      ]
    : [
        { label: 'Home', href: '/' },
        { label: 'Jobs', href: '/jobs' },
        { label: 'About Us', href: '/about' },
        { label: 'Contact Us', href: '/contact' },
      ]

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800">
      <div className="page-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-brand-700 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-glow transition-shadow">
              <Briefcase className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
              Career<span className="text-brand-600">Bridge</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all',
                  isActive(link.href)
                    ? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => dispatch(toggleDarkMode())}
              className="btn-ghost p-2 rounded-lg"
              title="Toggle theme"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {isAuthenticated && user ? (
              <>
                <div className="relative hidden md:block" ref={notificationRef}>
                  <button
                    onClick={() => {
                      const next = !notificationOpen
                      setNotificationOpen(next)
                      if (next) dispatch(fetchMyNotificationsThunk({ page: 0, size: 20 }))
                    }}
                    className="btn-ghost p-2 rounded-lg relative"
                    title="Notifications"
                    aria-label="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <>
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full" />
                        <span className="absolute -top-1 -right-1 min-w-[1rem] h-4 px-1 bg-brand-600 text-white text-[10px] rounded-full flex items-center justify-center">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      </>
                    )}
                  </button>

                  {notificationOpen && (
                    <div className="absolute right-0 mt-2 w-96 card shadow-lg py-1.5 animate-slide-down max-h-[28rem] overflow-hidden flex flex-col">
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifications</h4>
                        <div className="flex items-center gap-3">
                          {unreadCount > 0 && (
                            <button
                              onClick={() => dispatch(markAllAsRead())}
                              className="text-xs text-brand-500 hover:text-brand-600 transition-colors"
                            >
                              Mark all read
                            </button>
                          )}
                          {notifications.length > 0 && (
                            <button
                              onClick={() => dispatch(clearAllNotifications())}
                              className="text-xs text-red-500 hover:text-red-600 transition-colors"
                            >
                              Clear all
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="overflow-y-auto">
                        {notificationsLoading ? (
                          <div className="px-4 py-8 text-center text-sm text-slate-500">Loading notifications...</div>
                        ) : notifications.length === 0 ? (
                          <div className="px-4 py-10 text-center">
                            <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            <p className="text-sm text-slate-500">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={cn(
                                'px-4 py-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors',
                                !notification.read && 'bg-brand-50/50 dark:bg-brand-900/10',
                              )}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                                    {notification.message}
                                  </p>
                                  <p className="text-[11px] text-slate-500 mt-2">
                                    {formatTimeAgo(notification.timestamp)}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1">
                                  {!notification.read && (
                                    <button
                                      onClick={() => dispatch(markAsRead(notification.id))}
                                      className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500"
                                      title="Mark as read"
                                      aria-label="Mark as read"
                                    >
                                      <CheckCheck className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    onClick={() => dispatch(removeNotification(notification.id))}
                                    className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-500 hover:text-red-500"
                                    title="Remove notification"
                                    aria-label="Remove notification"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative" ref={dropRef}>
                  <button
                    onClick={() => setDropOpen(!dropOpen)}
                    className="flex items-center gap-2 pl-1 pr-3 py-1 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <Avatar name={user.fullName} src={user.profileImageUrl} size="sm" />
                    <span className="hidden md:block text-sm font-medium text-slate-700 dark:text-slate-300">
                      {user.fullName.split(' ')[0]}
                    </span>
                    <ChevronDown className="w-3 h-3 text-slate-400 hidden md:block" />
                  </button>

                  {dropOpen && (
                    <div className="absolute right-0 mt-2 w-56 card shadow-lg py-1.5 animate-slide-down">
                      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{user.fullName}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                        <DropItem icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" onClick={() => { navigate(dashboardHref); setDropOpen(false) }} />
                      <DropItem icon={<User className="w-4 h-4" />} label="Profile" onClick={() => { navigate('/profile'); setDropOpen(false) }} />
                      {user.role === 'JOB_SEEKER' && (
                        <DropItem icon={<Briefcase className="w-4 h-4" />} label="My Applications" onClick={() => { navigate('/applications'); setDropOpen(false) }} />
                      )}
                      {user.role === 'RECRUITER' && (
                        <>
                          <DropItem icon={<LayoutDashboard className="w-4 h-4" />} label="Recruiter Dashboard" onClick={() => { navigate('/recruiter/jobs'); setDropOpen(false) }} />
                          <DropItem icon={<Plus className="w-4 h-4" />} label="Post a Job" onClick={() => { navigate('/recruiter/post-job'); setDropOpen(false) }} />
                        </>
                      )}
                      {user.role === 'ADMIN' && (
                        <DropItem icon={<LayoutDashboard className="w-4 h-4" />} label="Admin Panel" onClick={() => { navigate('/admin'); setDropOpen(false) }} />
                      )}
                      <div className="border-t border-slate-100 dark:border-slate-800 mt-1 pt-1">
                        <DropItem icon={<LogOut className="w-4 h-4" />} label="Log out" onClick={() => { dispatch(logout()); setDropOpen(false) }} danger />
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" className="text-sm" onClick={() => navigate('/login')}>Sign in</Button>
                <Button variant="primary" className="text-sm" onClick={() => navigate('/register')}>Get Started</Button>
              </div>
            )}

            <button className="md:hidden btn-ghost p-2" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 animate-slide-down">
          <div className="page-container py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  'block px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                  isActive(link.href)
                    ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800',
                )}
              >{link.label}</Link>
            ))}
            {!isAuthenticated && (
              <div className="flex gap-2 pt-2 pb-1">
                <Link to="/login" className="btn-secondary flex-1 text-center text-sm" onClick={() => setMenuOpen(false)}>Sign in</Link>
                <Link to="/register" className="btn-primary flex-1 text-center text-sm" onClick={() => setMenuOpen(false)}>Get Started</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

function DropItem({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors text-left',
        danger
          ? 'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800',
      )}
    >
      {icon}
      {label}
    </button>
  )
}
