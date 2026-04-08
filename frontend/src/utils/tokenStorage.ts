import { STORAGE_KEYS } from '../constants/storage'

export function getStoredToken() {
  return sessionStorage.getItem(STORAGE_KEYS.authToken) ?? localStorage.getItem(STORAGE_KEYS.authToken)
}

export function isStoredTokenRemembered() {
  return localStorage.getItem(STORAGE_KEYS.authToken) != null
}

export function setStoredToken(token: string, remember = false) {
  clearStoredToken()

  if (remember) {
    localStorage.setItem(STORAGE_KEYS.authToken, token)
    return
  }

  sessionStorage.setItem(STORAGE_KEYS.authToken, token)
}

export function clearStoredToken() {
  sessionStorage.removeItem(STORAGE_KEYS.authToken)
  localStorage.removeItem(STORAGE_KEYS.authToken)
}

export function persistStoredTokenPreference(remember: boolean) {
  const token = getStoredToken()

  if (!token) {
    return
  }

  setStoredToken(token, remember)
}
