import { apiDeleteWithToken, apiGet, apiPostWithToken, apiPutWithToken } from '../../../services/apiClient'
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
import type { RaceFilterOptions, RaceFilters } from '../types/raceFilters'
import { appendRaceFilters } from './sharedRaceFilters'

export function fetchRaceTable(token: string, filters?: RaceFilters) {
  const params = new URLSearchParams()
  appendRaceFilters(params, filters)
  const query = params.toString()

  return apiGet<RaceTablePayload>(`/api/races/table${query ? `?${query}` : ''}`, token, {
    suppressUnauthorized: true,
  })
}

export function fetchRaceTypes(token: string) {
  return apiGet<RaceTypeOption[]>('/api/races/types', token, {
    suppressUnauthorized: true,
  })
}

export function fetchRaceCreateOptions(token: string) {
  return apiGet<RaceCreateOptions>('/api/races/create/options', token, {
    suppressUnauthorized: true,
  })
}

export function fetchRaceDetail(raceId: string, token: string) {
  return apiGet<RaceDetailResponse>(`/api/races/${raceId}`, token, {
    suppressUnauthorized: true,
  })
}

export function fetchManagedRaceOptions(optionType: ManagedRaceOptionType, token: string) {
  return apiGet<RaceTypeOption[]>(`/api/races/options/${optionType}`, token, {
    suppressUnauthorized: true,
  })
}

export function createManagedRaceOption(optionType: ManagedRaceOptionType, payload: ManageRaceOptionPayload, token: string) {
  return apiPostWithToken<RaceTypeOption>(`/api/races/options/${optionType}`, payload, token, {
    suppressUnauthorized: true,
  })
}

export function updateManagedRaceOption(optionType: ManagedRaceOptionType, optionId: string, payload: ManageRaceOptionPayload, token: string) {
  return apiPutWithToken<RaceTypeOption>(`/api/races/options/${optionType}/${optionId}`, payload, token, {
    suppressUnauthorized: true,
  })
}

export function deleteManagedRaceOption(optionType: ManagedRaceOptionType, optionId: string, token: string) {
  return apiDeleteWithToken<void>(`/api/races/options/${optionType}/${optionId}`, token, undefined, {
    suppressUnauthorized: true,
  })
}

export function fetchManagedRaceOptionUsage(optionType: ManagedRaceOptionType, optionId: string, token: string) {
  return apiGet<RaceOptionUsage>(`/api/races/options/${optionType}/${optionId}/usage`, token, {
    suppressUnauthorized: true,
  })
}

export function detachManagedRaceOptionUsage(optionType: ManagedRaceOptionType, optionId: string, token: string) {
  return apiDeleteWithToken<void>(`/api/races/options/${optionType}/${optionId}/detach`, token, undefined, {
    suppressUnauthorized: true,
  })
}

export function fetchRaceFilterOptions(token: string) {
  return apiGet<RaceFilterOptions>('/api/races/filters/options', token, {
    suppressUnauthorized: true,
  })
}

export function createRace(payload: CreateRacePayload, token: string) {
  return apiPostWithToken<CreateRaceResponse>('/api/races', payload, token, {
    suppressUnauthorized: true,
  })
}

export function updateRaceTableItem(raceId: string, payload: UpdateRaceTableItemPayload, token: string) {
  return apiPutWithToken<RaceTableItem>(`/api/races/${raceId}`, payload, token, {
    suppressUnauthorized: true,
  })
}

export function deleteRaceTableItems(raceIds: string[], token: string) {
  return apiDeleteWithToken<void>('/api/races/bulk', token, { raceIds }, {
    suppressUnauthorized: true,
  })
}
