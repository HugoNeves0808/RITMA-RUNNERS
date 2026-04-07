export type PendingApproval = {
  id: string
  email: string
  accountStatus: 'PENDING' | 'ACTIVE'
  requestedAt: string
}

export type ApprovePendingApprovalResponse = {
  email: string
  temporaryPassword: string
}
