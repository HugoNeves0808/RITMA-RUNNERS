import { STORAGE_KEYS } from '../constants/storage'

export function getStoredToken() {
  return localStorage.getItem(STORAGE_KEYS.authToken)
}

export function setStoredToken(token: string) {
  localStorage.setItem(STORAGE_KEYS.authToken, token)
}

export function clearStoredToken() {
  localStorage.removeItem(STORAGE_KEYS.authToken)
}
