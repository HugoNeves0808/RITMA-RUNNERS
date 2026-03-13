export type PendingAccount = {
  id: string
  email: string
  accountStatus: 'PENDING' | 'ACTIVE'
  createdAt: string
}
