import { createContext, useEffect, useState } from 'react'
import { changePassword, getCurrentUser, loginRequest } from '../services/authService'
import { clearStoredToken, getStoredToken, setStoredToken } from '../../../utils/tokenStorage'
import type { AuthenticatedUser, ChangePasswordPayload, LoginPayload } from '../types/auth'

export type AuthContextValue = {
  user: AuthenticatedUser | null
  token: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<void>
  submitPasswordChange: (payload: ChangePasswordPayload) => Promise<void>
  logout: () => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken())
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
      } catch {
        clearStoredToken()
        setToken(null)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    void loadCurrentUser()
  }, [token])

  const login = async (payload: LoginPayload) => {
    const response = await loginRequest(payload)
    setStoredToken(response.token)
    setToken(response.token)
    setUser(response.user)
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
    clearStoredToken()
    setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user),
        isAdmin: user?.role === 'ADMIN',
        isLoading,
        login,
        submitPasswordChange,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
