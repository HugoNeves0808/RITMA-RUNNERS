export const API_BASE_URL = 'http://localhost:8081'

export const buildApiUrl = (path: string) => `${API_BASE_URL}${path}`

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })

  if (!response.ok) {
    throw await buildApiError(response)
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

export async function apiDeleteWithToken<T>(path: string, token?: string): Promise<T> {
  return apiRequest<T>(path, {
    method: 'DELETE',
    token,
  })
}

async function apiRequest<T>(
  path: string,
  options: {
    method: 'POST' | 'DELETE'
    token?: string
    body?: unknown
  },
): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    method: options.method,
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })

  if (!response.ok) {
    throw await buildApiError(response)
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

async function buildApiError(response: Response) {
  try {
    const payload = await response.json() as { message?: string }
    if (payload.message) {
      return new Error(payload.message)
    }
  } catch {
    // Ignore parsing errors and fall back to HTTP status text.
  }

  return new Error(`HTTP ${response.status}`)
}
