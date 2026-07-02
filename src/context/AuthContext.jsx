import React, { createContext, useContext, useState, useEffect } from 'react'
import AuthService from '../services/AuthService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => AuthService.getCurrentUser())

  const signup = (data) => {
    const result = AuthService.signup(data)
    if (result.ok) setUser(result.user)
    return result
  }

  const login = (data) => {
    const result = AuthService.login(data)
    if (result.ok) setUser(result.user)
    return result
  }

  const logout = () => {
    AuthService.logout()
    setUser(null)
  }

  const updateProfile = (updates) => {
    const updated = AuthService.updateProfile(updates)
    if (updated) setUser(updated)
    return updated
  }

  return (
    <AuthContext.Provider value={{ user, signup, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
