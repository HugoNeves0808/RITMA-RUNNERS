const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL?.trim() || 'http://localhost:8081'

export const config = {
  apiBaseUrl,
} as const
