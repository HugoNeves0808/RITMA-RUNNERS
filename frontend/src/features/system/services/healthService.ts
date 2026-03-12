import { apiGet } from '../../../services/apiClient'
import type { BackendHealth } from '../../../types/system'

export function fetchBackendHealth() {
  return apiGet<BackendHealth>('/api/health')
}
