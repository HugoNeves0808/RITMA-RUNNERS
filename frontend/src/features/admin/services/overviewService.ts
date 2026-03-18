import { apiGet } from '../../../services/apiClient'

export type AdminOverviewPayload = {
  totalUsers: number
  totalAdmins: number
  totalNonAdmins: number
  dailyWebsiteAccesses: number
  activeUsersToday: number
  weeklyAverageWebsiteAccesses: number
  newRegistrationsLast7Days: number
}

export function fetchAdminOverview(token: string) {
  return apiGet<AdminOverviewPayload>('/api/admin/overview', token)
}
