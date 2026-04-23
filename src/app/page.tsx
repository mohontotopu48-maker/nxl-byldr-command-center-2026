'use client'

import { useState, useCallback } from 'react'
import { LandingPage } from '@/components/landing-page'
import { CommandCenter } from '@/components/command-center'

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      const auth = localStorage.getItem('vsual_auth')
      if (auth) {
        const parsed = JSON.parse(auth)
        return !!parsed.loggedIn
      }
    } catch {}
    return false
  })

  const handleLogin = useCallback((userData?: { name: string; email: string; role: string }) => {
    if (userData) {
      localStorage.setItem('vsual_auth', JSON.stringify({ ...userData, loggedIn: true }))
    }
    setIsLoggedIn(true)
  }, [])

  const handleLogout = useCallback(() => {
    localStorage.removeItem('vsual_auth')
    setIsLoggedIn(false)
  }, [])

  if (!isLoggedIn) return <LandingPage onLogin={handleLogin} />
  return <CommandCenter onLogout={handleLogout} />
}
