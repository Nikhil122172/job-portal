import { Navigate, useLocation } from 'react-router-dom'
import { useAppSelector } from '../../shared/hooks/redux'

export function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user } = useAppSelector((s) => s.auth)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export function PublicOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAppSelector((s) => s.auth)
  if (isAuthenticated) return <Navigate to="/" replace />
  return <>{children}</>
}
