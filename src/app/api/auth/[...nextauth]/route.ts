import NextAuth, { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const email = user.email || ""
        const isAllowedDomain = email.endsWith('@s.smakstlouis1sby.sch.id') || email.endsWith('@smakstlouis1sby.sch.id')
        
        if (isAllowedDomain) {
          return true
        } else {
          // Redirect to login page with error
          return "/login?error=InvalidDomain"
        }
      }
      return true
    },
  },
  pages: {
    signIn: '/login',
  },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
