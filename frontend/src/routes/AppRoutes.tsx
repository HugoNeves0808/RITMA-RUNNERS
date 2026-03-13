import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { ROUTES } from '../constants/routes'
import { AdminDiagnosticsPage } from '../pages/AdminDiagnosticsPage/AdminDiagnosticsPage'
import { AdminPendingAccountsPage } from '../pages/AdminPendingAccountsPage/AdminPendingAccountsPage'
import { HomePage } from '../pages/HomePage/HomePage'
import { LoginPage } from '../pages/LoginPage/LoginPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path={ROUTES.home} element={<HomePage />} />
      </Route>
      <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
        <Route path={ROUTES.adminDiagnostics} element={<AdminDiagnosticsPage />} />
        <Route path={ROUTES.adminPendingAccounts} element={<AdminPendingAccountsPage />} />
      </Route>
    </Routes>
  )
}
