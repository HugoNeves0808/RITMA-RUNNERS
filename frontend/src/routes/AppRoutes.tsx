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

const PodiumsPage = lazy(async () => {
  const module = await import('../pages/PodiumsPage/PodiumsPage')
  return { default: module.PodiumsPage }
})

const HomePage = lazy(async () => {
  const module = await import('../pages/HomePage/HomePage')
  return { default: module.HomePage }
})

const TrainingsPage = lazy(async () => {
  const module = await import('../pages/TrainingsPage/TrainingsPage')
  return { default: module.TrainingsPage }
})

const RootRedirectPage = lazy(async () => {
  const module = await import('../pages/RootRedirectPage/RootRedirectPage')
  return { default: module.RootRedirectPage }
})

const LoginPage = lazy(async () => {
  const module = await import('../pages/LoginPage/LoginPage')
  return { default: module.LoginPage }
})

const PendingApprovalsPage = lazy(async () => {
  const module = await import('../pages/PendingApprovalsPage/PendingApprovalsPage')
  return { default: module.PendingApprovalsPage }
})

const PersonalOptionsRaceTypesPage = lazy(async () => {
  const module = await import('../pages/PersonalOptionsPage/PersonalOptionsPage')
  return { default: () => <module.PersonalOptionsPage optionType="race-types" /> }
})

const PersonalOptionsTrainingTypesPage = lazy(async () => {
  const module = await import('../pages/PersonalOptionsPage/PersonalOptionsPage')
  return { default: () => <module.PersonalOptionsPage optionType="training-types" /> }
})

const PersonalOptionsTeamsPage = lazy(async () => {
  const module = await import('../pages/PersonalOptionsPage/PersonalOptionsPage')
  return { default: () => <module.PersonalOptionsPage optionType="teams" /> }
})

const PersonalOptionsCircuitsPage = lazy(async () => {
  const module = await import('../pages/PersonalOptionsPage/PersonalOptionsPage')
  return { default: () => <module.PersonalOptionsPage optionType="circuits" /> }
})

const PersonalOptionsShoesPage = lazy(async () => {
  const module = await import('../pages/PersonalOptionsPage/PersonalOptionsPage')
  return { default: () => <module.PersonalOptionsPage optionType="shoes" /> }
})

const ProfilePage = lazy(async () => {
  const module = await import('../pages/ProfilePage/ProfilePage')
  return { default: module.ProfilePage }
})

const SettingsPage = lazy(async () => {
  const module = await import('../pages/SettingsPage/SettingsPage')
  return { default: module.SettingsPage }
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
        <Route element={<ProtectedRoute />}>
          <Route path={ROUTES.home} element={<RootRedirectPage />} />
          <Route path={ROUTES.races} element={<HomePage />} />
          <Route path={ROUTES.trainings} element={<TrainingsPage />} />
          <Route path={ROUTES.bestEfforts} element={<BestEffortsPage />} />
          <Route path={ROUTES.podiums} element={<PodiumsPage />} />
          <Route path={ROUTES.personalOptionRaceTypes} element={<PersonalOptionsRaceTypesPage />} />
          <Route path={ROUTES.personalOptionTrainingTypes} element={<PersonalOptionsTrainingTypesPage />} />
          <Route path={ROUTES.personalOptionTeams} element={<PersonalOptionsTeamsPage />} />
          <Route path={ROUTES.personalOptionCircuits} element={<PersonalOptionsCircuitsPage />} />
          <Route path={ROUTES.personalOptionShoes} element={<PersonalOptionsShoesPage />} />
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
    </Suspense>
  )
}
