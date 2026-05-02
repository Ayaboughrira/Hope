import { connectDB } from "../../../config/mongodb";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const body = await request.json();
    const { userType, email, password, ...userData } = body;

    if (!userType || !email || !password) {
      return NextResponse.json(
        { message: "Données requises manquantes" },
        { status: 400 }
      );
    }

    const db = await connectDB();

    let collectionName;
    switch (userType) {
      case 'owner':       collectionName = 'user';        break;
      case 'vet':         collectionName = 'veterinaire'; break;
      case 'association': collectionName = 'association'; break;
      case 'store':       collectionName = 'animalrie';   break;
      default:
        return NextResponse.json(
          { message: "Type d'utilisateur non valide" },
          { status: 400 }
        );
    }

    const existingUser = await db.collection(collectionName).findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: "Cet email est déjà utilisé" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      email,
      password: hashedPassword,
      createdAt: new Date(),
      mfaSecret: null,     // ← AJOUT
      mfaEnabled: false,   // ← AJOUT
      ...userData
    };

    const result = await db.collection(collectionName).insertOne(newUser);

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