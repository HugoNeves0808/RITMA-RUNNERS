import { apiRequest } from '../../../services/apiClient'
import type {
  AuthenticatedUser,
  ChangePasswordPayload,
  LoginPayload,
  LoginResponse,
  RequestAccountPayload,
  RequestAccountResponse,
} from '../types/auth'

export function loginRequest(payload: LoginPayload) {
  return apiRequest<LoginResponse>('/api/auth/login', {
    method: 'POST',
    body: payload,
  })
}

export function requestAccount(payload: RequestAccountPayload) {
  return apiRequest<RequestAccountResponse>('/api/auth/request-account', {
    method: 'POST',
    body: payload,
  })
}

export function getCurrentUser(token: string) {
  return apiRequest<AuthenticatedUser>('/api/auth/me', {
    token,
  })
}

export function changePassword(payload: ChangePasswordPayload, token: string) {
  return apiRequest<void>('/api/auth/change-password', {
    method: 'POST',
    token,
    body: payload,
  })
}
