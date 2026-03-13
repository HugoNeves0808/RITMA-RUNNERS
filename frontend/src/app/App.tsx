import { Spin } from 'antd'
import { ForcePasswordChangeModal, useAuth } from '../features/auth'
import { AppShell } from '../layouts/AppShell'
import { AppRoutes } from '../routes/AppRoutes'
import styles from './App.module.css'

function App() {
  const { isLoading } = useAuth()

  if (isLoading) {
    return <div className={styles.appLoading}><Spin size="large" /></div>
  }

  return (
    <AppShell>
      <AppRoutes />
      <ForcePasswordChangeModal />
    </AppShell>
  )
}

export default App
