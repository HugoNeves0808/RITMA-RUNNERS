export type LoginPayload = {
  email: string
  password: string
}

export type RequestAccountPayload = {
  email: string
}

export type AuthenticatedUser = {
  id: string
  email: string
  role: 'ADMIN' | 'USER'
  forcePasswordChange: boolean
}

export type LoginResponse = {
  token: string
  expiresInMinutes: number
  user: AuthenticatedUser
}

export type RequestAccountResponse = {
  message: string
}
