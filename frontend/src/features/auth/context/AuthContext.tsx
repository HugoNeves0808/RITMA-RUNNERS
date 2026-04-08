import { createContext, useEffect, useState } from 'react'
import { changePassword, getCurrentUser, loginRequest, logoutRequest } from '../services/authService'
import {
  clearStoredToken,
  getStoredToken,
  isStoredTokenRemembered,
  persistStoredTokenPreference,
  setStoredToken,
} from '../../../utils/tokenStorage'
import { isApiError } from '../../../services/apiClient'
import type { AuthenticatedUser, ChangePasswordPayload, LoginPayload } from '../types/auth'

export type AuthContextValue = {
  user: AuthenticatedUser | null
  token: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  isLoading: boolean
  rememberSession: boolean
  login: (payload: LoginPayload, options?: { remember?: boolean }) => Promise<AuthenticatedUser>
  updateRememberSession: (remember: boolean) => void
  submitPasswordChange: (payload: ChangePasswordPayload) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken())
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [rememberSession, setRememberSession] = useState(() => isStoredTokenRemembered())

  useEffect(() => {
    const handleUnauthorized = (event: Event) => {
      const unauthorizedEvent = event as CustomEvent<{ token?: string }>
      const activeToken = getStoredToken()
      if (!unauthorizedEvent.detail?.token || unauthorizedEvent.detail.token !== activeToken) {
        return
      }

      clearStoredToken()
      setToken(null)
      setUser(null)
      setRememberSession(false)
      setIsLoading(false)
    }

    window.addEventListener('ritma:unauthorized', handleUnauthorized)

    return () => {
      window.removeEventListener('ritma:unauthorized', handleUnauthorized)
    }
  }, [])

  useEffect(() => {
    const loadCurrentUser = async () => {
      if (!token) {
        setUser(null)
        setIsLoading(false)
        return
      }

      try {
        const currentUser = await getCurrentUser(token)
        setUser(currentUser)
      } catch (error) {
        if (isApiError(error) && error.status === 401) {
          clearStoredToken()
          setToken(null)
          setUser(null)
          setRememberSession(false)
        }
      } finally {
        setIsLoading(false)
      }
    }

    void loadCurrentUser()
  }, [token])

  const login = async (payload: LoginPayload, options?: { remember?: boolean }) => {
    const response = await loginRequest(payload)
    setStoredToken(response.token, options?.remember ?? false)
    setToken(response.token)
    setUser(response.user)
    setRememberSession(options?.remember ?? false)
    return response.user
  }

  const updateRememberSession = (remember: boolean) => {
    persistStoredTokenPreference(remember)
    setRememberSession(remember)
  }

  const submitPasswordChange = async (payload: ChangePasswordPayload) => {
    if (!token || !user) {
      throw new Error('You must be signed in to change your password.')
    }

    await changePassword(payload, token)
    setUser({
      ...user,
      forcePasswordChange: false,
    })
  }

  const logout = () => {
    if (token) {
      void logoutRequest(token).catch(() => undefined)
    }

    clearStoredToken()
    setToken(null)
    setUser(null)
    setRememberSession(false)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === 'ADMIN',
        isLoading,
        rememberSession,
        login,
        updateRememberSession,
        submitPasswordChange,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
