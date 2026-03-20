export const API_BASE_URL = 'http://localhost:8081'

export const buildApiUrl = (path: string) => `${API_BASE_URL}${path}`

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

function notifyUnauthorized(token: string) {
  window.dispatchEvent(new CustomEvent('ritma:unauthorized', { detail: { token } }))
}

export async function apiGet<T>(
  path: string,
  token?: string,
  options?: { suppressUnauthorized?: boolean },
): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    headers: {
      'X-Client-Platform': 'web',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (!response.ok) {
    throw await buildApiError(response, token, options)
  }

  return response.json() as Promise<T>
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  return apiPostWithToken<T>(path, body)
}

export async function apiPostWithToken<T>(path: string, body: unknown, token?: string): Promise<T> {
  return apiRequest<T>(path, {
    method: 'POST',
    token,
    body,
  })
}

export async function apiPutWithToken<T>(path: string, body: unknown, token?: string): Promise<T> {
  return apiRequest<T>(path, {
    method: 'PUT',
    token,
    body,
  })
}

export async function apiDeleteWithToken<T>(path: string, token?: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: 'DELETE',
    token,
    body,
  })
}

async function apiRequest<T>(
  path: string,
  options: {
    method: 'POST' | 'PUT' | 'DELETE'
    token?: string
    body?: unknown
  },
): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    method: options.method,
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Platform': 'web',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    throw await buildApiError(response, options.token)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const contentLength = response.headers.get('content-length')
  const contentType = response.headers.get('content-type')
  if (contentLength === '0' || !contentType) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

async function buildApiError(
  response: Response,
  token?: string,
  options?: { suppressUnauthorized?: boolean },
) {
  if (token && response.status === 401 && !options?.suppressUnauthorized) {
    notifyUnauthorized(token)
  }

  try {
    const payload = await response.json() as { message?: string }
    if (payload.message) {
      return new ApiError(response.status, payload.message)
    }
  } catch {
    // Ignore parsing errors and fall back to HTTP status text.
  }

  return new ApiError(response.status, getFriendlyErrorMessage(response.status))
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
