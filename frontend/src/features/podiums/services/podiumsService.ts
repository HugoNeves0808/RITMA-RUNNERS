import { apiGet } from '../../../services/apiClient'
import type { PodiumHistoryPayload } from '../types/podiums'

export function fetchPodiumHistory(token: string) {
  return apiGet<PodiumHistoryPayload>('/api/podiums', token, {
    suppressUnauthorized: true,
  })
}
