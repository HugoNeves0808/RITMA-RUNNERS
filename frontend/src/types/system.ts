export type BackendHealth = {
  status: string
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
