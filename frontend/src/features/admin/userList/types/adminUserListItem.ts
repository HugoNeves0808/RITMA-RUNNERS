export type AdminUserListItem = {
  id: string
  email: string
  role: 'ADMIN' | 'USER'
  lastLoginAt: string | null
}
