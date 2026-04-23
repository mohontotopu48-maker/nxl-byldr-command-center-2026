import { signIn, signOut, useSession } from 'next-auth/react'

export { signIn, signOut, useSession }
export { authOptions } from '@/app/api/auth/[...nextauth]/route'

export const MASTER_ADMIN_EMAILS = ['info.vsualdm@gmail.com', 'geovsualdm@gmail.com']

export function isMasterAdmin(role?: string, email?: string): boolean {
  if (role === 'master_admin') return true
  if (email && MASTER_ADMIN_EMAILS.includes(email.toLowerCase())) return true
  return false
}
