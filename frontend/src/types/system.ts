export type BackendHealth = {
  status: string
  application: string
  databaseConfigured: boolean
  databaseStatus: string
  databaseName?: string
}

export type DiagnosticsPayload = {
  status: string
  application: string
  database: string
  serverTime: string
  currentUser: {
    email: string
    role: string
  }
}
