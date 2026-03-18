import { apiRequest } from '../../../../services/apiClient'
import type { AdminUserListItem } from '../types/adminUserListItem'

type FetchAdminUsersFilters = {
  search?: string
  onlyAdmins?: boolean
  staleOnly?: boolean
}

export function fetchAdminUsers(token: string, filters: FetchAdminUsersFilters = {}) {
  const searchParams = new URLSearchParams()

  if (filters.search?.trim()) {
    searchParams.set('search', filters.search.trim())
  }

  if (filters.onlyAdmins) {
    searchParams.set('onlyAdmins', 'true')
  }

  if (filters.staleOnly) {
    searchParams.set('staleOnly', 'true')
  }

  const query = searchParams.toString()

  return apiRequest<AdminUserListItem[]>(`/api/admin/users${query ? `?${query}` : ''}`, {
    token,
  })
}
