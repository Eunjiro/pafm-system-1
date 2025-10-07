import NextAuth, { type NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import FacebookProvider from "next-auth/providers/facebook"
import CredentialsProvider from "next-auth/providers/credentials"
import type { JWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    accessToken: string
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: string
    }
  }

  interface User {
    role: string
    accessToken?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string
    role?: string
    userId?: string
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        try {
          const response = await fetch(`${process.env.BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          const data = await response.json()

          if (response.ok && data.user) {
            return {
              id: data.user.id.toString(),
              email: data.user.email,
              name: data.user.fullName,
              role: data.user.role,
              accessToken: data.token,
            }
          }
          
          return null
        } catch (error) {
          console.error('Auth error:', error)
          return null
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account }: { token: JWT; user: any; account: any }) {
      // Handle social login
      if (account && (account.provider === 'google' || account.provider === 'facebook')) {
        try {
          const response = await fetch(`${process.env.BACKEND_URL}/api/auth/social-login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: user.email,
              providerId: account.providerAccountId,
              provider: account.provider,
              fullNameFirst: user.name?.split(' ')[0] || '',
              fullNameLast: user.name?.split(' ').slice(1).join(' ') || '',
            }),
          })

          const data = await response.json()

          if (response.ok && data.user) {
            token.accessToken = data.token
            token.role = data.user.role
            token.userId = data.user.id
          }
        } catch (error) {
          console.error('Social login error:', error)
        }
      }

      // Handle credentials login
      if (user && 'accessToken' in user) {
        token.accessToken = user.accessToken
        token.role = user.role
        token.userId = user.id
      }

      return token
    },
    async session({ session, token }: { session: any; token: JWT }) {
      if (token) {
        session.accessToken = token.accessToken as string
        session.user.role = token.role as string
        session.user.id = token.userId as string
      }
      return session
    },
    async redirect({ url, baseUrl }: { url: string; baseUrl: string }) {
      // Always redirect to port 3000 for sign-out
      if (url.includes('/api/auth/signout') || url.includes('signout')) {
        return 'http://localhost:3000'
      }
      
      // For callbackUrl parameter, redirect to port 3000
      if (url.includes('callbackUrl=http://localhost:3000') || url === 'http://localhost:3000') {
        return 'http://localhost:3000'
      }
      
      // Handle role-based redirects after login
      if (url.startsWith("/")) return `http://localhost:3000${url}`
      else if (new URL(url).origin === baseUrl) return url
      return 'http://localhost:3000'
    }
  },
  pages: {
    signIn: '/auth/signin',
    signOut: 'http://localhost:3000',
    error: '/auth/error',
  },
  session: {
    strategy: "jwt" as const,
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }