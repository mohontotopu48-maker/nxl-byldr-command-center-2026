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

        // Master admin check (hardcoded for reliability; password is verified via bcrypt)
        const MASTER_ADMINS = [
          { email: 'info.vsualdm@gmail.com', passwordHash: '$2b$10$U4wggkt6Poq81imvkTXlBuUjHSD9TqPYJBUi6FHLojoZwZ/7lJAsi' },
          { email: 'geovsualdm@gmail.com', passwordHash: '$2b$10$U4wggkt6Poq81imvkTXlBuUjHSD9TqPYJBUi6FHLojoZwZ/7lJAsi' },
        ]

        for (const admin of MASTER_ADMINS) {
          if (email === admin.email) {
            const isValid = await compare(password, admin.passwordHash)
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
            // Verify password against stored bcrypt hash
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
            // No valid bcrypt hash stored — reject login
            return null
          }

          // No auto-signup — only master admins can create team members
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
  secret: (() => {
    const s = process.env.NEXTAUTH_SECRET
    if (!s) throw new Error('NEXTAUTH_SECRET environment variable is required')
    return s
  })(),
  pages: {
    signIn: '/',
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST, authOptions }
