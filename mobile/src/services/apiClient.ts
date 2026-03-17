import { config } from '../constants/config'

type RequestOptions = {
  method?: 'GET' | 'POST' | 'DELETE'
  token?: string
  body?: unknown
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const response = await fetch(`${config.apiBaseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
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
        : `HTTP ${response.status}`

    throw new Error(message)
  }

  return payload as T
}
