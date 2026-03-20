import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { ROUTES } from '../constants/routes'
import { AdminRitmaOverviewPage } from '../pages/AdminRitmaOverviewPage/AdminRitmaOverviewPage'
import { AdminPendingAccountsPage } from '../pages/AdminPendingAccountsPage/AdminPendingAccountsPage'
import { BestEffortsPage } from '../pages/BestEffortsPage/BestEffortsPage'
import { FutureGoalsPage } from '../pages/FutureGoalsPage/FutureGoalsPage'
import { HomePage } from '../pages/HomePage/HomePage'
import { LoginPage } from '../pages/LoginPage/LoginPage'
import { PendingApprovalsPage } from '../pages/PendingApprovalsPage/PendingApprovalsPage'
import { ProfilePage } from '../pages/ProfilePage/ProfilePage'
import { SettingsPage } from '../pages/SettingsPage/SettingsPage'
import { UserListPage } from '../pages/UserListPage/UserListPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROUTES.login} element={<LoginPage />} />
      <Route path={ROUTES.futureGoals} element={<FutureGoalsPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path={ROUTES.home} element={<HomePage />} />
        <Route path={ROUTES.races} element={<HomePage />} />
        <Route path={ROUTES.bestEfforts} element={<BestEffortsPage />} />
        <Route path={ROUTES.profile} element={<ProfilePage />} />
        <Route path={ROUTES.settings} element={<SettingsPage />} />
      </Route>
      <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
        <Route path={ROUTES.adminRitmaOverview} element={<AdminRitmaOverviewPage />} />
        <Route path={ROUTES.adminUserList} element={<UserListPage />} />
        <Route path={ROUTES.adminPendingApprovals} element={<PendingApprovalsPage />} />
        <Route path={ROUTES.adminPendingAccounts} element={<AdminPendingAccountsPage />} />
      </Route>
    </Routes>
  )
}
