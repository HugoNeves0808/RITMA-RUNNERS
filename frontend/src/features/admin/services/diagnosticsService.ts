import { apiGet } from '../../../services/apiClient'
import type { DiagnosticsPayload } from '../../../types/system'

export function fetchAdminDiagnostics(token: string) {
  return apiGet<DiagnosticsPayload>('/api/admin/system-health', token)
}
