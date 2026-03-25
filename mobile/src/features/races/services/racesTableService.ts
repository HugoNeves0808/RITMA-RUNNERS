import { apiRequest } from '../../../services/apiClient'
import type {
  RaceCreateOptions,
  CreateRacePayload,
  CreateRaceResponse,
  ManageRaceOptionPayload,
  ManagedRaceOptionType,
  RaceDetailResponse,
  RaceOptionUsage,
  RaceTableItem,
  RaceTablePayload,
  RaceTypeOption,
  UpdateRaceTableItemPayload,
} from '../types/racesTable'
import type { RaceFilters } from '../types/raceFilters'
import { appendRaceFilters } from './sharedRaceFilters'

export function fetchRaceTable(token: string, filters?: RaceFilters) {
  const params = new URLSearchParams()
  appendRaceFilters(params, filters)
  const query = params.toString()

  return apiRequest<RaceTablePayload>(`/api/races/table${query ? `?${query}` : ''}`, {
    token,
  })
}

export function fetchRaceTypes(token: string) {
  return apiRequest<RaceTypeOption[]>('/api/races/types', {
    token,
  })
}

export function fetchRaceCreateOptions(token: string) {
  return apiRequest<RaceCreateOptions>('/api/races/create/options', {
    token,
  })
}

export function fetchRaceDetail(raceId: string, token: string) {
  return apiRequest<RaceDetailResponse>(`/api/races/${raceId}`, {
    token,
  })
}

export function fetchManagedRaceOptions(optionType: ManagedRaceOptionType, token: string) {
  return apiRequest<RaceTypeOption[]>(`/api/races/options/${optionType}`, {
    token,
  })
}

export function createManagedRaceOption(optionType: ManagedRaceOptionType, payload: ManageRaceOptionPayload, token: string) {
  return apiRequest<RaceTypeOption>(`/api/races/options/${optionType}`, {
    method: 'POST',
    token,
    body: payload,
  })
}

export function updateManagedRaceOption(optionType: ManagedRaceOptionType, optionId: string, payload: ManageRaceOptionPayload, token: string) {
  return apiRequest<RaceTypeOption>(`/api/races/options/${optionType}/${optionId}`, {
    method: 'PUT',
    token,
    body: payload,
  })
}

export function deleteManagedRaceOption(optionType: ManagedRaceOptionType, optionId: string, token: string) {
  return apiRequest<void>(`/api/races/options/${optionType}/${optionId}`, {
    method: 'DELETE',
    token,
  })
}

export function fetchManagedRaceOptionUsage(optionType: ManagedRaceOptionType, optionId: string, token: string) {
  return apiRequest<RaceOptionUsage>(`/api/races/options/${optionType}/${optionId}/usage`, {
    token,
  })
}

export function detachManagedRaceOptionUsage(optionType: ManagedRaceOptionType, optionId: string, token: string) {
  return apiRequest<void>(`/api/races/options/${optionType}/${optionId}/detach`, {
    method: 'DELETE',
    token,
  })
}

export function createRace(payload: CreateRacePayload, token: string) {
  return apiRequest<CreateRaceResponse>('/api/races', {
    method: 'POST',
    token,
    body: payload,
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
