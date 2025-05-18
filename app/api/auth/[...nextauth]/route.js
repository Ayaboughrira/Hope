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
          // Connexion à la base de données
          const db = await connectDB();
          
          // Recherche dans toutes les collections d'utilisateurs avec les noms corrects
          const collections = ['user', 'veterinaire', 'association', 'animalrie'];
          let user = null;
          let userType = null;
          
          // Chercher l'utilisateur dans chaque collection
          for (const collection of collections) {
            const foundUser = await db.collection(collection).findOne({ 
              email: credentials.email 
            });
            
            if (foundUser) {
              user = foundUser;
              // Mapper le nom de la collection au userType correct
              switch(collection) {
                case 'user':
                  userType = 'owner';
                  break;
                case 'veterinaire':
                  userType = 'vet';
                  break;
                case 'association':
                  userType = 'association';
                  break;
                case 'animalrie':
                  userType = 'store';
                  break;
                default:
                  userType = collection;
              }
              break;
            }
          }

          // Si aucun utilisateur n'est trouvé
          if (!user) {
            return null;
          }

          // Vérification du mot de passe
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          // Retourner les données utilisateur nécessaires
          return {
            id: user._id.toString(),
            email: user.email,
            name: user.firstName || user.clinicName || user.associationName || user.storeName || user.email,
            userType: userType
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
      // Transfert des données utilisateur au token
      if (user) {
        token.id = user.id;
        token.userType = user.userType;
      }
      return token;
    },
    async session({ session, token }) {
      // Transfert des données du token à la session
      if (token) {
        session.user.id = token.id;
        session.user.userType = token.userType;
      }
      return session;
    }
  },
  pages: {
    signIn: "/signuplogin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };