import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <AuthProvider>{children}</AuthProvider>
    </BrowserRouter>
  )
}
