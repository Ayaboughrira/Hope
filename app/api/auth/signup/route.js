import { connectDB } from "../../../config/mongodb";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { userType, email, password, ...userData } = body;

    // Vérification des données requises
    if (!userType || !email || !password) {
      return NextResponse.json(
        { message: "Données requises manquantes" },
        { status: 400 }
      );
    }

    // Connexion à la base de données
    const db = await connectDB();

    // Déterminer la collection en fonction du userType
    let collectionName;
    switch (userType) {
      case 'owner':
        collectionName = 'user';
        break;
      case 'vet':
        collectionName = 'veterinaire';
        break;
      case 'association':
        collectionName = 'association';
        break;
      case 'store':
        collectionName = 'animalrie';
        break;
      default:
        return NextResponse.json(
          { message: "Type d'utilisateur non valide" },
          { status: 400 }
        );
    }

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await db.collection(collectionName).findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "Cet email est déjà utilisé" },
        { status: 409 }
      );
    }

    // Hachage du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Création de l'utilisateur
    const newUser = {
      email,
      password: hashedPassword,
      createdAt: new Date(),
      ...userData
    };

    // Insertion dans la base de données
    const result = await db.collection(collectionName).insertOne(newUser);

    // Si l'insertion a réussi
    if (result.acknowledged) {
      return NextResponse.json(
        { 
          message: "Inscription réussie",
          userId: result.insertedId.toString(),
          userType
        },
        { status: 201 }
      );
    } else {
      return NextResponse.json(
        { message: "Échec de l'inscription" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    return NextResponse.json(
      { message: "Une erreur est survenue lors de l'inscription" },
      { status: 500 }
    );
  }
}