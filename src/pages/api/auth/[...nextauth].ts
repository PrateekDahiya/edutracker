import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from "../../../lib/mongodb";
import bcrypt from "bcryptjs";
import { connectToDatabase } from "@/models/db";
import { User } from "@/models/User";

export const authOptions: NextAuthOptions = {
  providers: [
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
    GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        profile(profile) {
          return {
            id: profile.sub,
            ...profile,
            user_id: profile.email ? profile.email.split('@')[0] : undefined,
          };
        },
      })
    ] : []),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          // Ensure database connection is established
          await connectToDatabase();
          
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          // Find user by email
          const user = await User.findOne({ email: credentials.email });
          
          if (!user) {
            return null;
          }

          // Check if user has a password (Google users might not have one)
          if (!user.password) {
            return null;
          }

          // Verify password
          const isValid = await bcrypt.compare(credentials.password, user.password);
          
          if (!isValid) {
            return null;
          }

          return { 
            id: user._id.toString(), 
            email: user.email, 
            name: user.name 
          };
        } catch (error) {
          console.error("Authentication error:", error);
          return null;
        }
      },
    }),
  ],
  adapter: MongoDBAdapter(clientPromise),
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session }) {
      try {
        // Always fetch the latest user data from the database
        if (session.user?.email) {
          await connectToDatabase();
          const user = await User.findOne({ email: session.user.email });
          if (user) {
            session.user.name = user.name;
            session.user.image = user.image;
            (session.user as unknown as { college: string }).college = user.college;
            (session.user as any).user_id = user.user_id;
          }
        }
      } catch (error) {
        console.error("Session callback error:", error);
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
  debug: process.env.NODE_ENV === "development",
};

// Validate that at least one provider is configured
if (authOptions.providers.length === 0) {
  console.error("No authentication providers configured. Please set up Google OAuth credentials or check your environment variables.");
}

export default NextAuth(authOptions); 