import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'
import Login from './pages/Login/Login'
import Callback from './pages/Callback/Callback'

/**
 * App ΓÇô root component.
 *
 * Top-level routing:
 *  - /login    ΓåÆ public Login page (no sidebar/header)
 *  - /callback ΓåÆ public OAuth callback handler
 *  - /*        ΓåÆ protected dashboard shell (Layout with sidebar/header)
 */
export default function App() {
  return (
    <Routes>
      {/* Public routes ΓÇö no Layout shell */}
      <Route path="/login" element={<Login />} />
      <Route path="/callback" element={<Callback />} />

      {/* Protected routes ΓÇö wrapped in Layout shell */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}
