import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { adminLogin } from '../lib/api'

export const TOKEN_KEY = 'soono-admin-token'

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [token, setToken] = useState(() => sessionStorage.getItem(TOKEN_KEY) || '')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)

  const clearAuth = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY)
    setToken('')
  }, [])

  const login = useCallback(async (event) => {
    event?.preventDefault?.()
    setLoginError('')
    setLoggingIn(true)
    try {
      const { token: newToken } = await adminLogin(password)
      sessionStorage.setItem(TOKEN_KEY, newToken)
      setToken(newToken)
      setPassword('')
    } catch (err) {
      if (err.message === 'SERVER_UNAVAILABLE') {
        setLoginError('서버에 연결할 수 없습니다. 개발 서버를 재시작해 주세요.')
      } else {
        setLoginError('비밀번호가 올바르지 않습니다.')
      }
    } finally {
      setLoggingIn(false)
    }
  }, [password])

  const logout = useCallback(() => {
    clearAuth()
    setPassword('')
    setLoginError('')
  }, [clearAuth])

  const value = useMemo(
    () => ({
      token,
      password,
      setPassword,
      loginError,
      loggingIn,
      login,
      logout,
      clearAuth,
      isAuthenticated: Boolean(token),
    }),
    [token, password, loginError, loggingIn, login, logout, clearAuth],
  )

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}
