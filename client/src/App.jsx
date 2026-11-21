import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { Spinner } from './components/ui/spinner'
import Layout from './components/layout/layout'
import Login from './pages/login'
import Dashboard from './pages/dashboard'
import Expenses from './pages/expenses'
import Revenues from './pages/revenues'
import Recurring from './pages/recurring'
import Analytics from './pages/analytics'
import Settings from './pages/settings'
import AiChat from './pages/ai'
import Transfers from './pages/transfers'

// Light splash while the session loads
function AppLoading() {
  return (
    <div className="min-h-dvh grid place-items-center bg-canvas">
      <Spinner size="w-5 h-5" />
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <AppLoading />
  if (!user) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <AppLoading />
  if (user) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          <PublicRoute><Login /></PublicRoute>
        } />
        <Route path="/" element={
          <ProtectedRoute><Layout /></ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="revenues" element={<Revenues />} />
          <Route path="recurring" element={<Recurring />} />
          <Route path="transfers" element={<Transfers />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
          <Route path="ai" element={<AiChat />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}