// app/api/auth/[...nextauth]/route
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectDB } from "../../../config/mongodb";
import bcrypt from "bcryptjs";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const db = await connectDB();
          const collections = ['user', 'veterinaire', 'association', 'animalrie'];
          let user = null;
          let userType = null;

          for (const collection of collections) {
            const foundUser = await db.collection(collection).findOne({
              email: credentials.email
            });

            if (foundUser) {
              user = foundUser;
              switch(collection) {
                case 'user':        userType = 'owner';       break;
                case 'veterinaire': userType = 'vet';         break;
                case 'association': userType = 'association'; break;
                case 'animalrie':   userType = 'store';       break;
                default:            userType = collection;
              }
              break;
            }
          }

          if (!user) return null;

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          if (!isPasswordValid) return null;

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.firstName || user.clinicName || user.associationName || user.storeName || user.email,
            userType: userType,
            mfaEnabled: user.mfaEnabled || false,  // ← AJOUT
          };
        } catch (error) {
          console.error("Erreur d'authentification:", error);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.userType = user.userType;
        token.mfaEnabled = user.mfaEnabled;   // ← AJOUT
        token.mfaVerified = false;             // ← AJOUT : false à chaque nouveau login
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.userType = token.userType;
        session.user.mfaEnabled = token.mfaEnabled;   // ← AJOUT
        session.user.mfaVerified = token.mfaVerified; // ← AJOUT
      }
      return session;
    }
  },
  pages: {
    signIn: "/signuplogin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };