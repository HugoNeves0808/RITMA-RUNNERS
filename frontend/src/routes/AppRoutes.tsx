import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { ROUTES } from '../constants/routes'
import { AdminDiagnosticsPage } from '../pages/AdminDiagnosticsPage/AdminDiagnosticsPage'
import { HomePage } from '../pages/HomePage/HomePage'
import { LoginPage } from '../pages/LoginPage/LoginPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.home} element={<HomePage />} />
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
        <Route path={ROUTES.adminDiagnostics} element={<AdminDiagnosticsPage />} />
      </Route>
    </Routes>
  )
}
