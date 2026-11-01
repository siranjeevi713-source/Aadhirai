import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('aadhirai_user')) } catch { return null }
  })
  const [loading, setLoading] = useState(false)

  const login = useCallback(async (credentials) => {
    const { data } = await api.post('/auth/login', credentials)
    if (data.success) {
      localStorage.setItem('aadhirai_token', data.token)
      localStorage.setItem('aadhirai_user', JSON.stringify(data.user))
      setUser(data.user)
    }
    return data
  }, [])

  const register = useCallback(async (payload) => {
    const { data } = await api.post('/auth/register', payload)
    if (data.success) {
      localStorage.setItem('aadhirai_token', data.token)
      localStorage.setItem('aadhirai_user', JSON.stringify(data.user))
      setUser(data.user)
    }
    return data
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('aadhirai_token')
    localStorage.removeItem('aadhirai_user')
    setUser(null)
    window.location.href = '/login'
  }, [])

  const refreshMe = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me')
      if (data.success) {
        localStorage.setItem('aadhirai_user', JSON.stringify(data.user))
        setUser(data.user)
      }
    } catch {}
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshMe }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

