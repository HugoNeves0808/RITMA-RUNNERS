import { apiDeleteWithToken, apiGet, apiPostWithToken, apiPutWithToken } from '../../../services/apiClient'
import type {
  TrainingCreateOptions,
  TrainingFilterOptions,
  TrainingFilters,
  TrainingRequest,
  TrainingTableItem,
  TrainingTableResponse,
  TrainingTypeOption,
  TrainingTypeUsage,
} from '../types/trainings'

function appendTrainingFilters(params: URLSearchParams, filters?: TrainingFilters) {
  if (!filters) {
    return
  }

  if (filters.search.trim()) {
    params.set('search', filters.search.trim())
  }

  filters.statuses.forEach((status) => params.append('statuses', status))
  filters.trainingTypeIds.forEach((trainingTypeId) => params.append('trainingTypeIds', trainingTypeId))
  filters.associations.forEach((association) => params.append('associations', association))
}

export function fetchTrainingTable(token: string, filters?: TrainingFilters) {
  const params = new URLSearchParams()
  appendTrainingFilters(params, filters)
  const query = params.toString()

  return apiGet<TrainingTableResponse>(`/api/trainings/table${query ? `?${query}` : ''}`, token, {
    suppressUnauthorized: true,
  })
}

export function fetchTrainingCreateOptions(token: string) {
  return apiGet<TrainingCreateOptions>('/api/trainings/create/options', token, {
    suppressUnauthorized: true,
  })
}

export function fetchTrainingFilterOptions(token: string) {
  return apiGet<TrainingFilterOptions>('/api/trainings/filters/options', token, {
    suppressUnauthorized: true,
  })
}

export function createTraining(payload: TrainingRequest, token: string) {
  return apiPostWithToken<TrainingTableItem[]>('/api/trainings', payload, token, {
    suppressUnauthorized: true,
  })
}

export function updateTraining(trainingId: string, payload: TrainingRequest, token: string) {
  return apiPutWithToken<TrainingTableItem>(`/api/trainings/${trainingId}`, payload, token, {
    suppressUnauthorized: true,
  })
}

export function updateTrainingCompletion(trainingId: string, completed: boolean, token: string) {
  return apiPutWithToken<TrainingTableItem>(`/api/trainings/${trainingId}/completion?completed=${completed}`, undefined, token, {
    suppressUnauthorized: true,
  })
}

export function deleteTraining(trainingId: string, token: string, scope: 'single' | 'series' = 'single') {
  return apiDeleteWithToken<void>(`/api/trainings/${trainingId}?scope=${scope}`, token, undefined, {
    suppressUnauthorized: true,
  })
}

export function fetchTrainingTypes(token: string, includeArchived = false) {
  return apiGet<TrainingTypeOption[]>(`/api/trainings/types${includeArchived ? '?includeArchived=true' : ''}`, token, {
    suppressUnauthorized: true,
  })
}

export function createTrainingType(name: string, token: string) {
  return apiPostWithToken<TrainingTypeOption>('/api/trainings/types', { name }, token, {
    suppressUnauthorized: true,
  })
}

export function updateTrainingType(trainingTypeId: string, name: string, token: string) {
  return apiPutWithToken<TrainingTypeOption>(`/api/trainings/types/${trainingTypeId}`, { name }, token, {
    suppressUnauthorized: true,
  })
}

export function updateTrainingTypeArchived(trainingTypeId: string, archived: boolean, token: string) {
  return apiPutWithToken<TrainingTypeOption>(`/api/trainings/types/${trainingTypeId}/archive?archived=${archived}`, undefined, token, {
    suppressUnauthorized: true,
  })
}

export function deleteTrainingType(trainingTypeId: string, token: string) {
  return apiDeleteWithToken<void>(`/api/trainings/types/${trainingTypeId}`, token, undefined, {
    suppressUnauthorized: true,
  })
}

export function fetchTrainingTypeUsage(trainingTypeId: string, token: string) {
  return apiGet<TrainingTypeUsage>(`/api/trainings/types/${trainingTypeId}/usage`, token, {
    suppressUnauthorized: true,
  })
}
