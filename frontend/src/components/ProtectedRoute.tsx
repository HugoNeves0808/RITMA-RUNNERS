import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Spin } from 'antd'
import { useAuth } from '../auth/AuthProvider'

type ProtectedRouteProps = {
  requiredRole?: 'ADMIN' | 'USER'
}

export function ProtectedRoute({ requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <Spin size="large" />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (requiredRole === 'ADMIN' && !isAdmin) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
