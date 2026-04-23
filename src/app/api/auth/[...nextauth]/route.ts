import NextAuth, { type NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'VSUAL Business OS',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = credentials.email.toLowerCase()
        const password = credentials.password

        // Master admin check
        const MASTER_ADMINS = [
          { email: 'info.vsualdm@gmail.com', password: 'VSUAL@NX$260&' },
          { email: 'geovsualdm@gmail.com', password: 'VSUAL@NX$260&' },
        ]

        for (const admin of MASTER_ADMINS) {
          if (email === admin.email && password === admin.password) {
            return {
              id: `admin-${admin.email}`,
              name: admin.email.split('@')[0],
              email: admin.email,
              role: 'master_admin',
              image: null,
            }
          }
        }

        // For any other user, check the database TeamMember table
        try {
          const { db } = await import('@/lib/db')
          const user = await db.teamMember.findUnique({ where: { email } })

          if (user) {
            // Verify password against stored password
            if (user.password && user.password.length > 0 && user.password === password) {
              return {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                image: user.avatar,
              }
            }
            // Legacy fallback: if no password stored, allow any password >= 6 chars
            if (!user.password && password.length >= 6) {
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

          // Auto-signup: any user with password >= 6 chars can sign up
          if (password.length >= 6) {
            const newUser = await db.teamMember.create({
              data: {
                name: email.split('@')[0],
                email,
                password,
                role: 'member',
                status: 'active',
              },
            })
            return {
              id: newUser.id,
              name: newUser.name,
              email: newUser.email,
              role: 'member',
              image: null,
            }
          }
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
  secret: process.env.NEXTAUTH_SECRET || 'vsual-business-os-secret-key-2025',
  pages: {
    signIn: '/',
  },
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST, authOptions }
