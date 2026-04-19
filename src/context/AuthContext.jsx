import { createContext, useContext, useState, useCallback, useMemo } from 'react'

/**
 * AuthContext – Global authentication state for ShadowStack.
 *
 * Manages the full GitHub OAuth lifecycle:
 *  - Stores the access_token in React state + localStorage
 *  - Stores the authenticated GitHub user profile
 *  - Provides hydration-aware `isLoading` flag so ProtectedRoute
 *    doesn't flash-redirect on initial page load
 *
 * Token key: "shadowstack_token" (matches apiClient.ts interceptor)
 * User key:  "shadowstack_user"
 */

const TOKEN_KEY = 'shadowstack_token'
const USER_KEY = 'shadowstack_user'

const AuthContext = createContext(null)

/**
 * Parse stored user JSON safely.
 * @returns {object|null}
 */
function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    localStorage.removeItem(USER_KEY)
    return null
  }
}

export function AuthProvider({ children }) {
  // Lazy-initialize from localStorage so we survive page reloads
  const [token, setTokenState] = useState(
    () => localStorage.getItem(TOKEN_KEY),
  )
  const [user, setUserState] = useState(readStoredUser)

  // ── Token management ─────────────────────────────────────────────────────
  const setToken = useCallback((t) => {
    if (t) {
      localStorage.setItem(TOKEN_KEY, t)
    } else {
      localStorage.removeItem(TOKEN_KEY)
    }
    setTokenState(t)
  }, [])

  // ── User profile management ──────────────────────────────────────────────
  const setUser = useCallback((u) => {
    if (u) {
      localStorage.setItem(USER_KEY, JSON.stringify(u))
    } else {
      localStorage.removeItem(USER_KEY)
    }
    setUserState(u)
  }, [])

  // ── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem('connected_repo')
    setTokenState(null)
    setUserState(null)
  }, [])

  // ── Context value (memoized to prevent unnecessary re-renders) ──────────
  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: !!token,
      setToken,
      setUser,
      logout,
    }),
    [token, user, setToken, setUser, logout],
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * useAuth – convenience hook to consume the auth context.
 * Throws if used outside <AuthProvider>.
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>')
  }
  return ctx
}

export default AuthContext
