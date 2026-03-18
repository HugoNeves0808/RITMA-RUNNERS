import { apiGet, apiPost, apiPostWithToken } from '../../../services/apiClient'
import type {
  AuthenticatedUser,
  ChangePasswordPayload,
  LoginPayload,
  LoginResponse,
  RequestAccountPayload,
  RequestAccountResponse,
} from '../types/auth'

export function loginRequest(payload: LoginPayload) {
  return apiPost<LoginResponse>('/api/auth/login', payload)
}

export function getCurrentUser(token: string) {
  return apiGet<AuthenticatedUser>('/api/auth/me', token)
}

export function requestAccount(payload: RequestAccountPayload) {
  return apiPost<RequestAccountResponse>('/api/auth/request-account', payload)
}

export function changePassword(payload: ChangePasswordPayload, token: string) {
  return apiPostWithToken<void>('/api/auth/change-password', payload, token)
}

export function logoutRequest(token: string) {
  return apiPostWithToken<void>('/api/auth/logout', {}, token)
}
