import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from '../features/auth'
import { LanguageProvider } from '../contexts/LanguageContext'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <AuthProvider>{children}</AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  )
}
