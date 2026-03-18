import { apiRequest } from '../../../services/apiClient'

export type DiagnosticsPayload = {
  status: string
  application: string
  database: string
  serverTime: string
  currentUser: {
    email: string
    role: string
  }
}

export function fetchAdminDiagnostics(token: string) {
  return apiRequest<DiagnosticsPayload>('/api/admin/system-health', {
    token,
  })
}
