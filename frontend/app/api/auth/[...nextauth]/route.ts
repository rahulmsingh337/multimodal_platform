import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

const handler = NextAuth({
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
  },
})

export { handler as GET, handler as POST }
