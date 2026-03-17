export type PendingApproval = {
  id: string
  email: string
  accountStatus: 'PENDING' | 'ACTIVE'
  requestedAt: string
}
