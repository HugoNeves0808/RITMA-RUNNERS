import { apiRequest } from '../../../services/apiClient'
import type {
  RaceTableItem,
  RaceTablePayload,
  RaceTypeOption,
  UpdateRaceTableItemPayload,
} from '../types/racesTable'

export function fetchRaceTable(token: string) {
  return apiRequest<RaceTablePayload>('/api/races/table', {
    token,
  })
}

export function fetchRaceTypes(token: string) {
  return apiRequest<RaceTypeOption[]>('/api/races/types', {
    token,
  })
}

export function updateRaceTableItem(raceId: string, payload: UpdateRaceTableItemPayload, token: string) {
  return apiRequest<RaceTableItem>(`/api/races/${raceId}`, {
    method: 'PUT',
    token,
    body: payload,
  })
}

export function deleteRaceTableItems(raceIds: string[], token: string) {
  return apiRequest<void>('/api/races/bulk', {
    method: 'DELETE',
    token,
    body: { raceIds },
  })
}
