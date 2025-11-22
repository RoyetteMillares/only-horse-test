import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Google from "next-auth/providers/google"
import Facebook from "next-auth/providers/facebook"
import Credentials from "next-auth/providers/credentials"
import { db } from "@/lib/db"
import bcrypt from "bcryptjs"

// Auth.js v5 configuration
// Reference: https://authjs.dev/getting-started/adapters/prisma
// — Royette
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
    }),
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required")
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email as string },
        })

        if (!user || !user.password) {
          throw new Error("Invalid credentials")
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )

        if (!isPasswordValid) {
          throw new Error("Invalid credentials")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account, trigger }: any) {
      // Initial login - fetch user data
      if (user) {
        token.id = user.id
        token.email = user.email

        // Fetch user data from database
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { role: true, profileImage: true, image: true, kycStatus: true, name: true },
        })

        if (dbUser) {
          token.role = dbUser.role
          token.needsSetup = !dbUser.role
          token.image = dbUser.profileImage || dbUser.image || user.image
          token.kycStatus = dbUser.kycStatus || 'NOT_STARTED'
          token.name = dbUser.name || user.name
        }
      }

      // Refresh user data from database when session is explicitly updated
      // This ensures the header and profile image updates automatically without page reload
      // Only refresh when updateSession() is called (trigger === 'update')
      // — Royette
      if (token.id && trigger === 'update') {
        try {
          const dbUser = await db.user.findUnique({
            where: { id: token.id as string },
            select: { role: true, profileImage: true, image: true, name: true, kycStatus: true },
          })

          if (dbUser) {
            token.role = dbUser.role
            token.needsSetup = !dbUser.role
            // Use profileImage first, fall back to image field
            token.image = dbUser.profileImage || dbUser.image || token.image
            token.name = dbUser.name || token.name
            token.kycStatus = dbUser.kycStatus || 'NOT_STARTED'
          }
          console.log('roy: JWT callback refreshed user data from database')
        } catch (error) {
          // Silently fail - keep existing token data
          console.error('roy: Error refreshing user data in JWT callback:', error)
        }
      }

      return token
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role
        session.user.needsSetup = token.needsSetup as boolean
        session.user.image = token.image as string | null
        session.user.kycStatus = token.kycStatus as string || 'NOT_STARTED'
        session.user.name = token.name as string | null
      }
      return session
    },
    async signIn({ user, account }: any) {
      // Allow sign in for both email and OAuth
      return true
    },
  },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
})

// Export route handlers for Next.js App Router
// Reference: https://authjs.dev/getting-started/adapters/prisma
// — Royette
export const { GET, POST } = handlers
