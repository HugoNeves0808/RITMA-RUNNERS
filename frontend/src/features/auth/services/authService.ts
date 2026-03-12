import { apiGet, apiPost } from '../../../services/apiClient'
import type { AuthenticatedUser, LoginPayload, LoginResponse } from '../../../types/auth'

export function loginRequest(payload: LoginPayload) {
  return apiPost<LoginResponse>('/api/auth/login', payload)
}

export function getCurrentUser(token: string) {
  return apiGet<AuthenticatedUser>('/api/auth/me', token)
}
