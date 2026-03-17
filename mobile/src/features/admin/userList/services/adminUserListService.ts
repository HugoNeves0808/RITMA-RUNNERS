import { apiRequest } from '../../../../services/apiClient'
import type { AdminUserListItem } from '../types/adminUserListItem'

export function fetchAdminUsers(token: string) {
  return apiRequest<AdminUserListItem[]>('/api/admin/users', {
    token,
  })
}
