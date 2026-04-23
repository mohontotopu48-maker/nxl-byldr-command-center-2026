'use client'

import React, { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  KeyRound,
  CheckCircle2,
  ShieldCheck,
  Globe,
  Zap,
  UserCheck,
  Building2,
  Phone,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { MASTER_ADMIN_EMAILS } from '@/lib/constants'

interface LandingPageProps {
  onLogin: (userData?: { name: string; email: string; role: string; portalType: string }) => void
}

const cubicEase: [number, number, number, number] = [0.22, 1, 0.36, 1]
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: cubicEase } },
}
const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: cubicEase } },
}

type ForgotStep = 'email' | 'otp' | 'newPassword' | 'success'
type AuthMode = 'admin' | 'customer'
type AuthAction = 'login' | 'register'

export function LandingPage({ onLogin }: LandingPageProps) {
  const [authMode, setAuthMode] = useState<AuthMode>('admin')
  const [authAction, setAuthAction] = useState<AuthAction>('login')

  // Common fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Customer registration extra fields
  const [regName, setRegName] = useState('')
  const [regCompany, setRegCompany] = useState('')
  const [regPhone, setRegPhone] = useState('')

  // Forgot password
  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotStep, setForgotStep] = useState<ForgotStep>('email')
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotOtp, setForgotOtp] = useState('')
  const [forgotNewPassword, setForgotNewPassword] = useState('')
  const [forgotShowPassword, setForgotShowPassword] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)

  const isCustomer = authMode === 'customer'
  const isRegister = authAction === 'register'

  // Switch mode — reset form
  const switchMode = (mode: AuthMode) => {
    if (mode !== authMode) {
      setAuthMode(mode)
      setAuthAction('login')
      resetForm()
    }
  }

  const switchAction = (action: AuthAction) => {
    setAuthAction(action)
    setError('')
  }

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setRegName('')
    setRegCompany('')
    setRegPhone('')
    setError('')
  }

  // ═══ ADMIN LOGIN ═══
  const handleAdminLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.')
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/auth/callback/credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (res.ok) {
        const data = await res.json().catch(() => null)
        const role = MASTER_ADMIN_EMAILS.includes(email.toLowerCase() as typeof MASTER_ADMIN_EMAILS[number]) ? 'master_admin' : (data?.user?.role || 'member')
        const authData = { name: data?.user?.name || email.split('@')[0], email, role, portalType: 'admin' as const, loggedIn: true }
        localStorage.setItem('vsual_auth', JSON.stringify(authData))
        toast.success('Welcome to VSUAL NXL BYLDR Command Center!')
        onLogin({ name: authData.name, email, role, portalType: 'admin' })
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data?.error || data?.message || 'Invalid credentials.')
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
      toast.error('Unable to connect to server.')
    } finally {
      setLoading(false)
    }
  }, [email, password, onLogin])

  // ═══ CUSTOMER LOGIN ═══
  const handleCustomerLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.')
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/auth/customer-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (res.ok) {
        const data = await res.json()
        const authData = { name: data.user.name, email: data.user.email, role: 'customer', portalType: 'customer' as const, loggedIn: true }
        localStorage.setItem('vsual_auth', JSON.stringify(authData))
        toast.success(`Welcome to your Customer Portal, ${data.user.name}!`)
        onLogin({ name: data.user.name, email: data.user.email, role: 'customer', portalType: 'customer' })
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data?.error || 'Invalid credentials.')
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
      toast.error('Unable to connect to server.')
    } finally {
      setLoading(false)
    }
  }, [email, password, onLogin])

  // ═══ CUSTOMER REGISTER ═══
  const handleCustomerRegister = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    if (!regName.trim()) {
      setError('Please enter your full name.')
      setLoading(false)
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.')
      setLoading(false)
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      setLoading(false)
      return
    }
    try {
      const res = await fetch('/api/auth/customer-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: regName.trim(),
          email: email.trim().toLowerCase(),
          password,
          company: regCompany.trim() || undefined,
          phone: regPhone.trim() || undefined,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        const authData = { name: data.name, email: data.email, role: 'customer', portalType: 'customer' as const, loggedIn: true }
        localStorage.setItem('vsual_auth', JSON.stringify(authData))
        toast.success('Account created! Welcome to your Customer Portal!')
        onLogin({ name: data.name, email: data.email, role: 'customer', portalType: 'customer' })
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data?.error || 'Registration failed.')
      }
    } catch {
      setError('Network error. Please try again.')
      toast.error('Unable to connect to server.')
    } finally {
      setLoading(false)
    }
  }, [regName, email, password, regCompany, regPhone, onLogin])

  // ═══ FORGOT PASSWORD ═══
  const openForgotPassword = () => { setForgotEmail(''); setForgotOtp(''); setForgotNewPassword(''); setForgotStep('email'); setForgotOpen(true) }
  const handleRequestOtp = async () => {
    if (!forgotEmail.trim() || !forgotEmail.includes('@')) { toast.error('Enter a valid email.'); return }
    setForgotLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: forgotEmail }) })
      if (res.ok) { const data = await res.json(); toast.success(data.message || 'OTP sent!'); setForgotStep('otp'); if (data.otp && process.env.NODE_ENV === 'development') toast.info(`Dev OTP: ${data.otp}`, { duration: 10000 }) }
      else { const data = await res.json().catch(() => ({})); toast.error(data.error || 'Failed.') }
    } catch { toast.error('Failed.') } finally { setForgotLoading(false) }
  }
  const handleVerifyOtp = async () => {
    if (!forgotOtp.trim() || forgotOtp.length !== 6) { toast.error('Enter the 6-digit OTP.'); return }
    setForgotLoading(true)
    try {
      const res = await fetch('/api/auth/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: forgotEmail, otp: forgotOtp }) })
      if (res.ok) { toast.success('OTP verified!'); setForgotStep('newPassword') }
      else { const data = await res.json().catch(() => ({})); toast.error(data.error || 'Invalid OTP.') }
    } catch { toast.error('Failed.') } finally { setForgotLoading(false) }
  }
  const handleResetPassword = async () => {
    if (!forgotNewPassword.trim() || forgotNewPassword.length < 6) { toast.error('Min 6 characters.'); return }
    setForgotLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: forgotEmail, otp: forgotOtp, newPassword: forgotNewPassword }) })
      if (res.ok) { toast.success('Password reset!'); setForgotStep('success') }
      else { const data = await res.json().catch(() => ({})); toast.error(data.error || 'Failed.') }
    } catch { toast.error('Failed.') } finally { setForgotLoading(false) }
  }
  const closeForgotAndLogin = () => { setForgotOpen(false); setEmail(forgotEmail); setPassword(''); setError('') }

  const handleSubmit = (e: React.FormEvent) => {
    if (isCustomer && isRegister) {
      handleCustomerRegister(e)
    } else if (isCustomer) {
      handleCustomerLogin(e)
    } else {
      handleAdminLogin(e)
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ backgroundColor: '#0B0B0F' }}>

      {/* Full Background Image - AI Growth/Marketing Ecosystem */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/landing-bg.png)' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-[#0B0B0F]/50 via-[#0B0B0F]/65 to-[#0B0B0F]/92" />

      {/* VSUAL Brand Watermark - top left */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-10 opacity-[0.07] pointer-events-none">
        <img src="/vsual-brand-cover.jpg" alt="" className="h-28 w-28 md:h-36 md:w-36 object-contain" />
      </div>

      {/* Background layers */}
      <div className="animate-mesh absolute inset-0 opacity-30"
        style={{ background: 'linear-gradient(125deg, #0B0B0F 0%, #1a0a14 25%, #0B0B0F 50%, #140a1a 75%, #0B0B0F 100%)' }} />
      <div className="absolute inset-0 animate-grid-pulse"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,0,153,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,153,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }} />
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full animate-orb-1 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,0,153,0.06) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full animate-orb-2 pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(255,0,153,0.04) 0%, transparent 70%)' }} />
      <div className="absolute inset-x-0 h-px animate-scan-line pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,0,153,0.12) 50%, transparent 100%)' }} />

      {/* Main Content */}
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.15 } } }}
        className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-8"
      >

        {/* Logo + Title */}
        <motion.div variants={fadeUp} className="flex items-center gap-3 mb-6">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 shadow-lg shadow-primary/10">
              <img src="https://i.ibb.co.com/mV5xXLnB/VSUAL.png" alt="VSUAL" className="h-8 w-8 object-contain" />
            </div>
            <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary animate-pulse-slow" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-bold tracking-wide text-foreground">VSUAL NXL BYLDR</span>
            <span className="text-[10px] font-semibold text-primary tracking-wider uppercase">Command Center</span>
          </div>
        </motion.div>

        {/* Header */}
        <motion.div variants={fadeUp} className="text-center mb-8 max-w-md">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Welcome to your <span className="text-primary">Command Center</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Growth · Marketing · AI Automation — your complete business ecosystem.
          </p>
        </motion.div>

        {/* ═══ LOGIN MODE TOGGLE ═══ */}
        <motion.div variants={fadeUp} className="mb-6">
          <div className="flex items-center gap-2 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
            <button
              onClick={() => switchMode('admin')}
              className={`flex items-center gap-2 flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                authMode === 'admin'
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Admin Login</span>
            </button>
            <button
              onClick={() => switchMode('customer')}
              className={`flex items-center gap-2 flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
                authMode === 'customer'
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserCheck className="h-4 w-4" />
              <span>Customer Portal</span>
            </button>
          </div>
        </motion.div>

        {/* Login Card */}
        <motion.div variants={scaleIn} className="w-full max-w-md">
          <div className="relative rounded-2xl border border-white/[0.06] bg-[#14141A]/80 backdrop-blur-2xl shadow-2xl shadow-black/50 animate-glow-ring overflow-hidden">
            <div className="h-px w-full" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,0,153,0.4), transparent)' }} />
            <div className="p-6 sm:p-8">

              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 mb-3">
                  {isCustomer ? <UserCheck className="h-3.5 w-3.5 text-primary" /> : <ShieldCheck className="h-3.5 w-3.5 text-primary" />}
                  <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                    {isCustomer ? 'Customer Portal' : 'Secure Admin'}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-foreground">
                  {isCustomer
                    ? (isRegister ? 'Create Your Account' : 'Customer Sign In')
                    : 'Admin Sign In'
                  }
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {isCustomer
                    ? (isRegister
                      ? 'Join VSUAL NXL BYLDR — track your project & contact Sal & Geo'
                      : 'Access your project journey & contact Sal & Geo')
                    : 'Access your VSUAL NXL BYLDR Command Center'
                  }
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">

                {/* ═══ CUSTOMER REGISTRATION: Name Field ═══ */}
                {isCustomer && isRegister && (
                  <div className="space-y-2">
                    <Label htmlFor="reg-name" className="text-sm text-foreground">Full Name *</Label>
                    <div className="relative">
                      <UserCheck className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="reg-name" type="text" placeholder="Your full name"
                        value={regName} onChange={(e) => { setRegName(e.target.value); setError('') }}
                        className="h-11 border-border bg-background/50 pl-9 text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary/30" />
                    </div>
                  </div>
                )}

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm text-foreground">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="you@example.com"
                      value={email} onChange={(e) => { setEmail(e.target.value); setError('') }}
                      className="h-11 border-border bg-background/50 pl-9 text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary/30" />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm text-foreground">
                    Password {isCustomer && isRegister && <span className="text-muted-foreground">(min 6 chars)</span>}
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input id="password" type={showPassword ? 'text' : 'password'}
                      placeholder={isCustomer && isRegister ? 'Create a password' : 'Enter your password'}
                      value={password} onChange={(e) => { setPassword(e.target.value); setError('') }}
                      className="h-11 border-border bg-background/50 pl-9 pr-10 text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary/30" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* ═══ CUSTOMER REGISTRATION: Company & Phone ═══ */}
                {isCustomer && isRegister && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="reg-company" className="text-sm text-foreground">Company</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input id="reg-company" type="text" placeholder="Company name"
                          value={regCompany} onChange={(e) => setRegCompany(e.target.value)}
                          className="h-11 border-border bg-background/50 pl-9 text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary/30" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-phone" className="text-sm text-foreground">Phone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input id="reg-phone" type="tel" placeholder="+1 (555) 000-0000"
                          value={regPhone} onChange={(e) => setRegPhone(e.target.value)}
                          className="h-11 border-border bg-background/50 pl-9 text-foreground placeholder:text-muted-foreground/50 focus-visible:ring-primary/30" />
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-sm text-destructive bg-destructive/5 border border-destructive/10 rounded-lg px-3 py-2">
                    {error}
                  </motion.p>
                )}

                {/* Admin: Remember me + Forgot password */}
                {!isCustomer && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox id="remember" checked={remember} onCheckedChange={(c) => setRemember(c === true)}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                      <Label htmlFor="remember" className="text-xs text-muted-foreground cursor-pointer">Remember me</Label>
                    </div>
                    <button type="button" onClick={openForgotPassword} className="text-xs text-primary hover:text-primary/80 transition-colors">
                      Forgot password?
                    </button>
                  </div>
                )}

                <Button type="submit" disabled={loading}
                  className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 font-semibold text-sm transition-all hover:shadow-xl hover:shadow-primary/30">
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isRegister ? 'Creating account...' : 'Signing in...'}</> : <>{isRegister ? 'Create Account' : 'Sign In'}<ArrowRight className="ml-2 h-4 w-4" /></>}
                </Button>
              </form>

              {/* Customer: Login / Register toggle */}
              {isCustomer && (
                <p className="text-center text-sm text-muted-foreground mt-6">
                  {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                  <button onClick={() => switchAction(isRegister ? 'login' : 'register')} className="text-primary hover:text-primary/80 font-semibold">
                    {isRegister ? 'Sign In' : 'Create one free'}
                  </button>
                </p>
              )}

              {/* Admin: OAuth */}
              {!isCustomer && (
                <>
                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                    <div className="relative flex justify-center text-xs">
                      <span className="px-3 text-muted-foreground bg-[#14141A]/80">or continue with</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {['google', 'apple', 'microsoft'].map((provider) => {
                      const label = provider.charAt(0).toUpperCase() + provider.slice(1)
                      return (
                        <Button key={provider} type="button" variant="outline"
                          onClick={() => {
                            const oauthRes = fetch('/api/auth/register', {
                              method: 'POST', headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ name: email.split('@')[0] || 'User', email: email || `${provider}-user@vsual.com`, provider }),
                            }).then(r => r.ok ? r.json() : null).then(data => {
                              if (data) {
                                const role = MASTER_ADMIN_EMAILS.includes((data.email || '').toLowerCase() as typeof MASTER_ADMIN_EMAILS[number]) ? 'master_admin' : (data.role || 'member')
                                const authData = { name: data.name || email.split('@')[0], email: data.email || email, role, portalType: 'admin' as const, loggedIn: true }
                                localStorage.setItem('vsual_auth', JSON.stringify(authData))
                                toast.success('Welcome to VSUAL NXL BYLDR Command Center!')
                                onLogin({ name: authData.name, email: authData.email, role, portalType: 'admin' })
                              } else {
                                toast.error(`Failed to sign in with ${label}`)
                              }
                            }).catch(() => toast.error('Network error.'))
                          }}
                          className="h-11 border-border bg-white hover:bg-gray-50 text-gray-700 flex flex-col items-center justify-center gap-1 py-2 px-1">
                          {provider === 'google' && (
                            <svg viewBox="0 0 24 24" className="h-4 w-4">
                              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                          )}
                          {provider === 'apple' && (
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                            </svg>
                          )}
                          {provider === 'microsoft' && (
                            <svg viewBox="0 0 23 23" className="h-4 w-4">
                              <rect x="1" y="1" width="10" height="10" fill="#F25022" />
                              <rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
                              <rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
                              <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
                            </svg>
                          )}
                          <span className="text-[11px] font-medium">{label}</span>
                        </Button>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div variants={fadeUp} className="mt-8 flex flex-col sm:flex-row items-center gap-3 text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src="https://i.ibb.co.com/2R1C5xG/image.png" alt="CA Logo" className="h-5 w-5 object-contain rounded" />
            <span className="text-xs">Powered by <span className="text-primary font-semibold">VSUAL</span> — Digital Media · Promotional Marketing Agency</span>
          </div>
          <span className="hidden sm:block text-border">|</span>
          <div className="flex items-center gap-1.5 text-xs">
            <Globe className="h-3 w-3" />
            <span>v2.0.0</span>
            <Zap className="h-3 w-3 text-primary" />
            <span>All systems operational</span>
          </div>
        </motion.div>
      </motion.div>

      {/* ═══ FORGOT PASSWORD DIALOG ═══ */}
      <Dialog open={forgotOpen} onOpenChange={(o) => { if (!o) setForgotOpen(false) }}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            {forgotStep === 'email' && (<><DialogTitle className="text-foreground flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" />Forgot Password</DialogTitle><DialogDescription className="text-muted-foreground">Enter your email address and we&apos;ll send you a verification code</DialogDescription></>)}
            {forgotStep === 'otp' && (<><DialogTitle className="text-foreground flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" />Verify OTP</DialogTitle><DialogDescription className="text-muted-foreground">Enter the 6-digit code sent to <span className="text-foreground font-medium">{forgotEmail}</span></DialogDescription></>)}
            {forgotStep === 'newPassword' && (<><DialogTitle className="text-foreground flex items-center gap-2"><Lock className="h-5 w-5 text-primary" />Reset Password</DialogTitle><DialogDescription className="text-muted-foreground">Enter your new password (minimum 6 characters)</DialogDescription></>)}
            {forgotStep === 'success' && (<><DialogTitle className="text-foreground flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" />Password Reset!</DialogTitle><DialogDescription className="text-muted-foreground">Your password has been reset successfully.</DialogDescription></>)}
          </DialogHeader>
          <div className="space-y-4 pt-2">
            {forgotStep === 'email' && (<>
              <div className="space-y-2">
                <Label className="text-sm text-foreground">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type="email" placeholder="you@example.com" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleRequestOtp() } }}
                    className="h-11 border-border bg-background pl-9 text-foreground" />
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setForgotOpen(false)} className="flex-1 border-border">Cancel</Button>
                <Button onClick={handleRequestOtp} disabled={forgotLoading} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                  {forgotLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Sending...</> : <>Send OTP<ArrowRight className="ml-2 h-4 w-4" /></>}
                </Button>
              </div>
            </>)}
            {forgotStep === 'otp' && (<>
              <div className="flex justify-center py-2">
                <InputOTP maxLength={6} value={forgotOtp} onChange={(v) => setForgotOtp(v)}>
                  <InputOTPGroup><InputOTPSlot index={0} className="bg-background border-border text-foreground" /><InputOTPSlot index={1} className="bg-background border-border text-foreground" /><InputOTPSlot index={2} className="bg-background border-border text-foreground" /></InputOTPGroup>
                  <InputOTPSeparator /><InputOTPGroup><InputOTPSlot index={3} className="bg-background border-border text-foreground" /><InputOTPSlot index={4} className="bg-background border-border text-foreground" /><InputOTPSlot index={5} className="bg-background border-border text-foreground" /></InputOTPGroup>
                </InputOTP>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setForgotStep('email')} className="flex-1 border-border">Back</Button>
                <Button onClick={handleVerifyOtp} disabled={forgotLoading || forgotOtp.length !== 6} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                  {forgotLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</> : <>Verify<ArrowRight className="ml-2 h-4 w-4" /></>}
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground">Didn&apos;t receive the code? <button onClick={handleRequestOtp} className="text-primary hover:underline" disabled={forgotLoading}>Resend</button></p>
            </>)}
            {forgotStep === 'newPassword' && (<>
              <div className="space-y-2">
                <Label className="text-sm text-foreground">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input type={forgotShowPassword ? 'text' : 'password'} placeholder="Minimum 6 characters" value={forgotNewPassword} onChange={(e) => setForgotNewPassword(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleResetPassword() } }}
                    className="h-11 border-border bg-background pl-9 pr-10 text-foreground" />
                  <button type="button" onClick={() => setForgotShowPassword(!forgotShowPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {forgotShowPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setForgotStep('otp')} className="flex-1 border-border">Back</Button>
                <Button onClick={handleResetPassword} disabled={forgotLoading || forgotNewPassword.length < 6} className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90">
                  {forgotLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Resetting...</> : <>Reset Password<ArrowRight className="ml-2 h-4 w-4" /></>}
                </Button>
              </div>
            </>)}
            {forgotStep === 'success' && (
              <div className="flex flex-col items-center py-4 space-y-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"><CheckCircle2 className="h-8 w-8 text-primary" /></div>
                <Button onClick={closeForgotAndLogin} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">Back to Sign In<ArrowRight className="ml-2 h-4 w-4" /></Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
