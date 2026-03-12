import { createContext, useContext, useEffect, useState } from 'react'
import { buildApiUrl } from '../api'

type User = {
  id: string
  email: string
  role: 'ADMIN' | 'USER'
  forcePasswordChange: boolean
}

type LoginPayload = {
  email: string
  password: string
}

type AuthContextValue = {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)
const TOKEN_STORAGE_KEY = 'ritma-runners-token'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY))
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadCurrentUser = async () => {
      if (!token) {
        setUser(null)
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch(buildApiUrl('/api/auth/me'), {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (!response.ok) {
          throw new Error('Session expired')
        }

        const currentUser = (await response.json()) as User
        setUser(currentUser)
      } catch {
        localStorage.removeItem(TOKEN_STORAGE_KEY)
        setToken(null)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    void loadCurrentUser()
  }, [token])

  const login = async ({ email, password }: LoginPayload) => {
    const response = await fetch(buildApiUrl('/api/auth/login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      throw new Error('Invalid email or password')
    }

    const data = (await response.json()) as { token: string; user: User }
    localStorage.setItem(TOKEN_STORAGE_KEY, data.token)
    setToken(data.token)
    setUser(data.user)
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
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
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
