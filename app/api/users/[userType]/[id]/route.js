import { NextResponse } from 'next/server';
import { connectDB } from '../../../../config/mongodb';
import { ObjectId } from 'mongodb';
import { verifyToken } from '../../../../config/auth';

/**
 * Gestionnaire de requête GET pour récupérer les données d'un utilisateur
 * Route: /api/users/[userType]/[id]
 */
export async function GET(request, { params }) {
  try {
    // Récupérer les paramètres de l'URL (accès direct pour Next.js 13+)
    const userType = params.userType;
    const id = params.id;
    
    // Vérifier que les paramètres requis sont présents
    if (!userType || !id) {
      return NextResponse.json({ 
        success: false, 
        message: 'Type d\'utilisateur et ID requis' 
      }, { status: 400 });
    }
    
    // Vérifier l'authentification (optionnel selon vos besoins de sécurité)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const verified = await verifyToken(token);
        
        if (!verified) {
          return NextResponse.json({ 
            success: false, 
            message: 'Token d\'authentification invalide' 
          }, { status: 401 });
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du token:', error);
        // Continuer l'exécution sans authentification si la configuration JWT est incorrecte
      }
    }
    
    // Connexion à la base de données
    // Notez que connectDB() retourne directement l'objet db dans votre configuration
    const db = await connectDB();
    
    // Vérifier que la connexion a réussi
    if (!db) {
      console.error('Échec de la connexion à la base de données');
      return NextResponse.json({ 
        success: false, 
        message: 'Erreur de connexion à la base de données' 
      }, { status: 500 });
    }
    
    // Déterminer la collection à interroger en fonction du type d'utilisateur
    let collection;
    switch (userType) {
      case 'owner':
        collection = db.collection('user');
        break;
      case 'vet':
        collection = db.collection('veterinaire');
        break;
      case 'association':
        collection = db.collection('association');
        break;
      case 'store':
        collection = db.collection('animalrie');
        break;
      default:
        return NextResponse.json({ 
          success: false, 
          message: 'Type d\'utilisateur non reconnu' 
        }, { status: 400 });
    }
    
    // Rechercher l'utilisateur par son ID
    let user;
    
    try {
      user = await collection.findOne({ _id: new ObjectId(id) });
    } catch (err) {
      console.error('Erreur lors de la recherche de l\'utilisateur:', err);
      return NextResponse.json({ 
        success: false, 
        message: 'ID utilisateur invalide' 
      }, { status: 400 });
    }
    
    // Vérifier si l'utilisateur a été trouvé
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'Utilisateur non trouvé' 
      }, { status: 404 });
    }
    
    // Supprimer le mot de passe des données renvoyées
    if (user.password) {
      delete user.password;
    }
    
    // Convertir l'ID MongoDB en chaîne pour la sérialisation JSON
    user._id = user._id.toString();
    
    // Renvoyer les données utilisateur
    return NextResponse.json({
      success: true,
      user
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des données utilisateur:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Erreur serveur lors de la récupération des données' 
    }, { status: 500 });
  }
}