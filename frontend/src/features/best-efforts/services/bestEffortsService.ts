import { apiGet } from '../../../services/apiClient'
import type { BestEffortPayload } from '../types/bestEfforts'

export function fetchBestEfforts(token: string) {
  return apiGet<BestEffortPayload>('/api/best-efforts', token, {
    suppressUnauthorized: true,
  })
}
