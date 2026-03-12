import { Spin } from 'antd'
import { AppShell } from '../layouts/AppShell'
import { AppRoutes } from '../routes/AppRoutes'
import { useAuth } from '../hooks/useAuth'
import './app.css'

function App() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return <div className="app-loading"><Spin size="large" /></div>
  }

  return (
    <AppShell>
      <AppRoutes />
    </AppShell>
  )
}

export default App
