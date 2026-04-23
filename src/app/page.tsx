'use client'

import { useState, useCallback } from 'react'
import { LandingPage } from '@/components/landing-page'
import { CommandCenter } from '@/components/command-center'
import { CustomerPortal } from '@/components/customer-portal'

export default function Home() {
  const [authData, setAuthData] = useState<{ name: string; email: string; role: string; portalType: string } | null>(() => {
    if (typeof window === 'undefined') return null
    try {
      const auth = localStorage.getItem('vsual_auth')
      if (auth) {
        const parsed = JSON.parse(auth)
        if (parsed.loggedIn) return parsed
      }
    } catch {}
    return null
  })

  const isLoggedIn = !!authData
  const isCustomerPortal = authData?.portalType === 'customer'

  const handleLogin = useCallback((userData?: { name: string; email: string; role: string; portalType: string }) => {
    if (userData) {
      localStorage.setItem('vsual_auth', JSON.stringify({ ...userData, loggedIn: true }))
      setAuthData(userData)
    } else {
      setAuthData(prev => prev ? { ...prev, loggedIn: true } : null)
    }
  }, [])

  const handleLogout = useCallback(() => {
    localStorage.removeItem('vsual_auth')
    setAuthData(null)
  }, [])

  if (!isLoggedIn || !authData) return <LandingPage onLogin={handleLogin} />

  // Customer Portal — separate view from admin
  if (isCustomerPortal) {
    return <CustomerPortal auth={authData} onLogout={handleLogout} />
  }

  // Admin Command Center
  return <CommandCenter onLogout={handleLogout} />
}
