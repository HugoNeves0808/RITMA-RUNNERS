import { Navigate } from 'react-router-dom'
import { ROUTES } from '../../constants/routes'
import { useAuth } from '../../features/auth'

export function RootRedirectPage() {
  const { isAdmin } = useAuth()

  if (isAdmin) {
    return <Navigate to={ROUTES.adminRitmaOverview} replace />
  }

  return <Navigate to={ROUTES.races} replace />
}

