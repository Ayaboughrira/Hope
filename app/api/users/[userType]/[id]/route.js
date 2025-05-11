import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { connectDB } from '../../../../config/mongodb';
import { ObjectId } from 'mongodb';

// Fonction helper pour mapper les types d'utilisateurs aux collections MongoDB
const getUserCollection = (userType) => {
  const collectionMap = {
    'owner': 'user',
    'vet': 'veterinaire',
    'association': 'association',
    'store': 'animalrie'
  };
  
  return collectionMap[userType] || null;
};

// Route GET pour récupérer les données d'un utilisateur spécifique
export async function GET(request, { params }) {
  try {
    // Récupérer les paramètres de la route
    const { userType, id } = params;
    
    // Vérifier si les paramètres sont valides
    if (!userType || !id || !['owner', 'vet', 'association', 'store'].includes(userType)) {
      return NextResponse.json(
        { success: false, message: 'Paramètres invalides' },
        { status: 400 }
      );
    }
    
    // Obtenir la session pour vérification d'authentification (optionnel)
    const session = await getServerSession(authOptions);
    
    // Option: Vérifier si l'utilisateur est authentifié
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé' },
        { status: 401 }
      );
    }
    
    // Option: Vérifier si l'utilisateur a le droit d'accéder à ce profil
    // Décommentez pour activer cette vérification
    /*
    const isAdmin = session.user.role === 'admin';
    const isOwnProfile = session.user.id === id && session.user.userType === userType;
    
    if (!isAdmin && !isOwnProfile) {
      return NextResponse.json(
        { success: false, message: 'Accès non autorisé à ce profil' },
        { status: 403 }
      );
    }
    */
    
    // Connexion à la base de données
    const db = await connectDB();
    
    // Obtenir le nom de la collection en fonction du type d'utilisateur
    const collectionName = getUserCollection(userType);
    if (!collectionName) {
      return NextResponse.json(
        { success: false, message: 'Type d\'utilisateur non reconnu' },
        { status: 400 }
      );
    }
    
    // Récupérer l'utilisateur de la base de données
    let user;
    try {
      user = await db.collection(collectionName).findOne({ _id: new ObjectId(id) });
    } catch (err) {
      return NextResponse.json(
        { success: false, message: 'ID utilisateur invalide' },
        { status: 400 }
      );
    }
    
    // Vérifier si l'utilisateur existe
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }
    
    // Supprimer le mot de passe et autres informations sensibles
    delete user.password;
    delete user.__v;
    
    // Convertir l'ObjectId en chaîne pour la sérialisation JSON
    user._id = user._id.toString();
    
    // Retourner les données de l'utilisateur
    return NextResponse.json(
      {
        success: true,
        user: user
      },
      { status: 200 }
    );
    
  } catch (error) {
    console.error('Erreur lors de la récupération des données utilisateur:', error);
    
    return NextResponse.json(
      { success: false, message: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}