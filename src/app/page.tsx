'use client'

import { useState, useCallback, useEffect } from 'react'
import { LandingPage } from '@/components/landing-page'
import { CommandCenter } from '@/components/command-center'
import { CustomerPortal } from '@/components/customer-portal'

export default function Home() {
  // Use a mounted gate to prevent hydration mismatch from localStorage
  const [mounted, setMounted] = useState(false)
  const [authData, setAuthData] = useState<{ name: string; email: string; role: string; portalType: string } | null>(null)

  useEffect(() => {
    try {
      const auth = localStorage.getItem('vsual_auth')
      if (auth) {
        const parsed = JSON.parse(auth)
        if (parsed.loggedIn) setAuthData(parsed)
      }
    } catch { /* empty */ }
    setMounted(true)
  }, [])

  const isLoggedIn = !!authData
  const isCustomerPortal = authData?.portalType === 'customer'

  const handleLogin = useCallback((userData?: { name: string; email: string; role: string; portalType: string }) => {
    if (userData) {
      localStorage.setItem('vsual_auth', JSON.stringify({ ...userData, loggedIn: true }))
      setAuthData(userData)
    }
  }, [])

  const handleLogout = useCallback(() => {
    localStorage.removeItem('vsual_auth')
    setAuthData(null)
  }, [])

  // Show nothing until mounted to prevent hydration mismatch
  if (!mounted) return null

  if (!isLoggedIn || !authData) return <LandingPage onLogin={handleLogin} />

  // Customer Portal — separate view from admin
  if (isCustomerPortal) {
    return <CustomerPortal auth={authData} onLogout={handleLogout} />
  }

  // Admin Command Center
  return <CommandCenter onLogout={handleLogout} />
}
