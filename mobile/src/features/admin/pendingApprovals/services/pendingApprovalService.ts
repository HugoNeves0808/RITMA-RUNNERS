import { apiRequest } from '../../../../services/apiClient'
import type { PendingApproval } from '../types/pendingApproval'

type PendingAccountApiResponse = {
  id: string
  email: string
  accountStatus: 'PENDING' | 'ACTIVE'
  createdAt: string
}

export async function fetchPendingApprovals(token: string) {
  const rows = await apiRequest<PendingAccountApiResponse[]>('/api/admin/account-requests', {
    token,
  })

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    accountStatus: row.accountStatus,
    requestedAt: row.createdAt,
  } satisfies PendingApproval))
}

export function approvePendingApproval(userId: string, token: string) {
  return apiRequest<void>(`/api/admin/account-requests/${userId}/approve`, {
    method: 'POST',
    token,
    body: {},
  })
}

export function rejectPendingApproval(userId: string, token: string) {
  return apiRequest<void>(`/api/admin/account-requests/${userId}`, {
    method: 'DELETE',
    token,
  })
}
