import { lazy, Suspense } from 'react'
import { Spin } from 'antd'
import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { ROUTES } from '../constants/routes'

const AdminRitmaOverviewPage = lazy(async () => {
  const module = await import('../pages/AdminRitmaOverviewPage/AdminRitmaOverviewPage')
  return { default: module.AdminRitmaOverviewPage }
})

const AdminPendingAccountsPage = lazy(async () => {
  const module = await import('../pages/AdminPendingAccountsPage/AdminPendingAccountsPage')
  return { default: module.AdminPendingAccountsPage }
})

const BestEffortsPage = lazy(async () => {
  const module = await import('../pages/BestEffortsPage/BestEffortsPage')
  return { default: module.BestEffortsPage }
})

const FutureGoalsPage = lazy(async () => {
  const module = await import('../pages/FutureGoalsPage/FutureGoalsPage')
  return { default: module.FutureGoalsPage }
})

const HomePage = lazy(async () => {
  const module = await import('../pages/HomePage/HomePage')
  return { default: module.HomePage }
})

const LoginPage = lazy(async () => {
  const module = await import('../pages/LoginPage/LoginPage')
  return { default: module.LoginPage }
})

const PendingApprovalsPage = lazy(async () => {
  const module = await import('../pages/PendingApprovalsPage/PendingApprovalsPage')
  return { default: module.PendingApprovalsPage }
})

const UserListPage = lazy(async () => {
  const module = await import('../pages/UserListPage/UserListPage')
  return { default: module.UserListPage }
})

function RouteLoadingFallback() {
  return <div style={{ display: 'grid', placeItems: 'center', minHeight: '40vh' }}><Spin size="large" /></div>
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        <Route path={ROUTES.login} element={<LoginPage />} />
        <Route path={ROUTES.futureGoals} element={<FutureGoalsPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path={ROUTES.home} element={<HomePage />} />
          <Route path={ROUTES.races} element={<HomePage />} />
          <Route path={ROUTES.bestEfforts} element={<BestEffortsPage />} />
        </Route>
        <Route element={<ProtectedRoute requiredRole="ADMIN" />}>
          <Route path={ROUTES.adminRitmaOverview} element={<AdminRitmaOverviewPage />} />
          <Route path={ROUTES.adminUserList} element={<UserListPage />} />
          <Route path={ROUTES.adminPendingApprovals} element={<PendingApprovalsPage />} />
          <Route path={ROUTES.adminPendingAccounts} element={<AdminPendingAccountsPage />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
