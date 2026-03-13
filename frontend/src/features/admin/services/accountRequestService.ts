import { apiDeleteWithToken, apiGet, apiPostWithToken } from '../../../services/apiClient'
import type { PendingAccount } from '../types/accountRequests'

export function fetchPendingAccounts(token: string) {
  return apiGet<PendingAccount[]>('/api/admin/account-requests', token)
}

export function approvePendingAccount(userId: string, token: string) {
  return apiPostWithToken<void>(`/api/admin/account-requests/${userId}/approve`, {}, token)
}

export function rejectPendingAccount(userId: string, token: string) {
  return apiDeleteWithToken<void>(`/api/admin/account-requests/${userId}`, token)
}
