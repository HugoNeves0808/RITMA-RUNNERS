import AsyncStorage from '@react-native-async-storage/async-storage'
import type { AuthSession } from '../types/auth'

const AUTH_SESSION_KEY = 'ritma.auth.session'

export async function loadAuthSession() {
  const rawSession = await AsyncStorage.getItem(AUTH_SESSION_KEY)
  if (!rawSession) {
    return null
  }

  try {
    return JSON.parse(rawSession) as AuthSession
  } catch {
    await AsyncStorage.removeItem(AUTH_SESSION_KEY)
    return null
  }
}

export function saveAuthSession(session: AuthSession) {
  return AsyncStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session))
}

export function clearAuthSession() {
  return AsyncStorage.removeItem(AUTH_SESSION_KEY)
}
