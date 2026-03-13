export type UserRole = 'ADMIN' | 'USER'

export type AuthenticatedUser = {
  id: string
  email: string
  role: UserRole
  forcePasswordChange: boolean
}

export type LoginPayload = {
  email: string
  password: string
}

export type LoginResponse = {
  token: string
  user: AuthenticatedUser
}

export type RequestAccountPayload = {
  email: string
}

export type RequestAccountResponse = {
  message: string
}

export type ChangePasswordPayload = {
  currentPassword: string
  newPassword: string
}
