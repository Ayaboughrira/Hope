// api/auth/login/route.js
import { connectDB } from "../../../config/mongodb";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // Vérification des données requises
    if (!email || !password) {
      return NextResponse.json(
        { message: "Email et mot de passe requis" },
        { status: 400 }
      );
    }

    // Connexion à la base de données
    const db = await connectDB();

    // Collections à vérifier
    const collections = [
      { name: 'user', type: 'owner' },
      { name: 'veterinaire', type: 'vet' },
      { name: 'association', type: 'association' },
      { name: 'animalrie', type: 'store' }
    ];

    // Rechercher l'utilisateur dans toutes les collections
    let user = null;
    let userType = null;

    for (const { name, type } of collections) {
      const foundUser = await db.collection(name).findOne({ email });
      
      if (foundUser) {
        // Vérifier le mot de passe
        const isPasswordValid = await bcrypt.compare(password, foundUser.password);
        
        if (isPasswordValid) {
          user = foundUser;
          userType = type;
          break;
        }
      }
    }

    // Si aucun utilisateur n'est trouvé ou mot de passe incorrect
    if (!user) {
      return NextResponse.json(
        { message: "Email ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    // Retourner les informations de l'utilisateur
    return NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.firstName || user.clinicName || user.associationName || user.storeName || user.email,
        userType: userType
      }
    });
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors de la connexion" },
      { status: 500 }
    );
  }
}