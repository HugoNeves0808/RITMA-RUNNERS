import { apiGet } from '../../../../services/apiClient'
import type { AdminUserListItem } from '../types/adminUserListItem'

export function fetchAdminUsers(token: string) {
  return apiGet<AdminUserListItem[]>('/api/admin/users', token)
}
