import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

// Force the canonical URL — this is what Google receives as redirect_uri
const NEXTAUTH_URL = 'https://multimodal-platform-eight.vercel.app'

const handler = NextAuth({
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          authorization: {
            params: {
              redirect_uri: `${NEXTAUTH_URL}/api/auth/callback/google`,
            },
          },
        })]
      : []),
  ],
  pages: { signIn: '/auth/signin' },
  secret: process.env.NEXTAUTH_SECRET || 'fallback-dev-secret-change-in-prod',
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) (session.user as any).id = token.sub
      return session
    },
    async redirect({ url, baseUrl }) {
      // Always redirect to canonical URL after sign in
      if (url.startsWith('/')) return `${NEXTAUTH_URL}${url}`
      if (url.startsWith(NEXTAUTH_URL)) return url
      return NEXTAUTH_URL
    },
  },
})

export { handler as GET, handler as POST }
