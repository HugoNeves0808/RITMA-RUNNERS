import { apiGet } from '../../../services/apiClient'
import type { ProfileSummary } from '../types/profile'

export function fetchProfileSummary(token: string) {
  return apiGet<ProfileSummary>('/api/profile', token)
}
