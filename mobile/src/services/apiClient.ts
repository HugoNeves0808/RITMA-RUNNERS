import { config } from '../constants/config'

type RequestOptions = {
  method?: 'GET' | 'POST' | 'DELETE'
  token?: string
  body?: unknown
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Platform': 'mobile',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  })

  const text = await response.text()
  const payload = text ? JSON.parse(text) : null

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload !== null && 'message' in payload
        ? String(payload.message)
        : getFriendlyErrorMessage(response.status)

    throw new ApiError(response.status, message)
  }

  return payload as T
}

function getFriendlyErrorMessage(status: number) {
  if (status === 401) {
    return 'Your session has expired. Please sign in again.'
  }

  if (status === 403) {
    return 'You do not have permission to access this area.'
  }

  if (status === 404) {
    return 'We could not find what you were looking for.'
  }

  if (status >= 500) {
    return 'Something went wrong on our side. Please try again.'
  }

  return 'Unable to complete the request right now. Please try again.'
}
