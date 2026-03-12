import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import Expenses from './pages/Expenses'
import { Investments, Goals, Alerts } from './pages/OtherPages'

function PrivateRoute({ children }) {
  const { user } = useAuth()
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" toastOptions={{
          style: { background: '#1a1a1a', color: '#f0ece4', border: '1px solid #2e2e2e', fontFamily: 'DM Sans' }
        }} />
        <Routes>
          <Route path="/login" element={<AuthPage />} />
          <Route path="/"              element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/gastos"        element={<PrivateRoute><Expenses /></PrivateRoute>} />
          <Route path="/investimentos" element={<PrivateRoute><Investments /></PrivateRoute>} />
          <Route path="/metas"         element={<PrivateRoute><Goals /></PrivateRoute>} />
          <Route path="/alertas"       element={<PrivateRoute><Alerts /></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
