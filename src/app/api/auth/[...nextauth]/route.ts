import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'VSUAL NXL BYLDR Command Center',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = credentials.email.toLowerCase()
        const password = credentials.password

        // Master admin check — password hash from env var (falls back to hardcoded only in dev)
        const masterAdminHash = process.env.MASTER_ADMIN_PASSWORD_HASH
        if (!masterAdminHash && process.env.NODE_ENV === 'production') {
          console.error('[SECURITY] MASTER_ADMIN_PASSWORD_HASH not set in production')
          return null
        }
        const hash = masterAdminHash || '$2b$10$U4wggkt6Poq81imvkTXlBuUjHSD9TqPYJBUi6FHLojoZwZ/7lJAsi'

        const MASTER_ADMINS = [
          { email: 'info.vsualdm@gmail.com' },
          { email: 'geovsualdm@gmail.com' },
        ]

        for (const admin of MASTER_ADMINS) {
          if (email === admin.email) {
            const isValid = await compare(password, hash)
            if (isValid) {
              return {
                id: `admin-${admin.email}`,
                name: admin.email.split('@')[0],
                email: admin.email,
                role: 'master_admin',
                image: null,
              }
            }
            return null
          }
        }

        // For any other user, check the database TeamMember table
        try {
          const { db } = await import('@/lib/db')
          const user = await db.teamMember.findUnique({ where: { email } })

          if (user) {
            if (user.password && user.password.length > 0 && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'))) {
              const isValid = await compare(password, user.password)
              if (!isValid) return null
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                image: user.avatar,
              }
            }
            return null
          }

          return null
        } catch (error) {
          console.error('Auth error:', error)
        }

        return null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as Record<string, unknown>
        token.role = u.role as string
        token.id = u.id as string
        token.email = u.email as string
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        const t = token as unknown as Record<string, unknown>
        ;(session.user as unknown as Record<string, unknown>).role = t.role
        ;(session.user as unknown as Record<string, unknown>).id = t.id
      }
      return session
    },
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'dev-only-insecure-fallback'),
  pages: {
    signIn: '/',
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST, authOptions }
