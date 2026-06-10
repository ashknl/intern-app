import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider } from '@tanstack/react-router'
import { router } from './router'
import { AuthProvider, useAuth } from '@/lib/auth'
import Login from '@/pages/Login'
import './index.css'

function AppContent() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <Login />
  }

  return <RouterProvider router={router} />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </React.StrictMode>,
)

// Use contextBridge
window.ipcRenderer.on('main-process-message', (_event, message) => {
  console.log(message)
})
