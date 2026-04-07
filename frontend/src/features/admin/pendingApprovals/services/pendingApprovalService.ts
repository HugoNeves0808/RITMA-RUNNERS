import { apiDeleteWithToken, apiGet, apiPostWithToken } from '../../../../services/apiClient'
import type { ApprovePendingApprovalResponse } from '../types/pendingApproval'

type PendingAccountApiResponse = {
  id: string
  email: string
  accountStatus: 'PENDING' | 'ACTIVE'
  createdAt: string
}

export function fetchPendingApprovals(token: string, search?: string, olderThanThreeDays?: boolean) {
  const searchParams = new URLSearchParams()

  if (search?.trim()) {
    searchParams.set('search', search.trim())
  }

  if (olderThanThreeDays) {
    searchParams.set('olderThanThreeDays', 'true')
  }

  const query = searchParams.toString()

  return apiGet<PendingAccountApiResponse[]>(`/api/admin/account-requests${query ? `?${query}` : ''}`, token)
    .then((rows) =>
      rows.map((row) => ({
        id: row.id,
        email: row.email,
        accountStatus: row.accountStatus,
        requestedAt: row.createdAt,
      })),
    )
}

export function approvePendingApproval(userId: string, token: string) {
  return apiPostWithToken<ApprovePendingApprovalResponse>(`/api/admin/account-requests/${userId}/approve`, {}, token)
}

export function rejectPendingApproval(userId: string, token: string) {
  return apiDeleteWithToken<void>(`/api/admin/account-requests/${userId}`, token)
}
