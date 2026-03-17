import { apiDeleteWithToken, apiGet, apiPostWithToken } from '../../../../services/apiClient'

type PendingAccountApiResponse = {
  id: string
  email: string
  accountStatus: 'PENDING' | 'ACTIVE'
  createdAt: string
}

export function fetchPendingApprovals(token: string) {
  return apiGet<PendingAccountApiResponse[]>('/api/admin/account-requests', token)
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
  return apiPostWithToken<void>(`/api/admin/account-requests/${userId}/approve`, {}, token)
}

export function rejectPendingApproval(userId: string, token: string) {
  return apiDeleteWithToken<void>(`/api/admin/account-requests/${userId}`, token)
}
