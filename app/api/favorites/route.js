// app/api/favorites/route.js
import { MongoClient, ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

const uri = process.env.MONGODB_URI;
let client;
let db;

async function connectDB() {
  try {
    if (!uri) {
      throw new Error('MONGODB_URI n\'est pas défini dans les variables d\'environnement');
    }
    
    if (db) return db;
    
    client = new MongoClient(uri);
    await client.connect();
    console.log('Connecté à MongoDB avec succès');
    
    db = client.db('Hope');
    return db;
  } catch (error) {
    console.error('Erreur de connexion à MongoDB:', error);
    throw new Error(`Impossible de se connecter à la base de données: ${error.message}`);
  }
}

// Fonction pour vérifier l'authentification
async function isAuthenticated() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { authenticated: false };
  }
  return { 
    authenticated: true,
    user: session.user
  };
}

// GET - Récupérer les favoris de l'utilisateur connecté
export async function GET(request) {
  try {
    // Vérifier l'authentification
    const auth = await isAuthenticated();
    if (!auth.authenticated) {
      return NextResponse.json({
        success: false,
        message: 'Authentification requise'
      }, { status: 401 });
    }

    const { user } = auth;
    const db = await connectDB();
    
    // Vérifier si des IDs spécifiques sont demandés (pour la page favorites)
    const { searchParams } = new URL(request.url);
    const requestedIds = searchParams.get('ids');
    
    if (requestedIds) {
      // Récupérer les animaux spécifiques pour la page des favoris
      const animalIds = requestedIds.split(',');
      const validIds = animalIds.filter(id => ObjectId.isValid(id));
      
      if (validIds.length === 0) {
        return NextResponse.json({ success: true, data: [] });
      }

      const animalsCollection = db.collection('animals');
      const pipeline = [
        { 
          $match: { 
            _id: { $in: validIds.map(id => new ObjectId(id)) }
          }
        },
        {
          $lookup: {
            from: 'species',
            localField: 'speciesId',
            foreignField: '_id',
            as: 'speciesDetails'
          }
        },
        {
          $unwind: {
            path: '$speciesDetails',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $lookup: {
            from: 'races',
            localField: 'raceId',
            foreignField: '_id',
            as: 'raceDetails'
          }
        },
        {
          $unwind: {
            path: '$raceDetails',
            preserveNullAndEmptyArrays: true
          }
        }
      ];
      
      const animals = await animalsCollection.aggregate(pipeline).toArray();
      
      return NextResponse.json({
        success: true,
        data: animals
      });
    } else {
      // Récupérer tous les favoris de l'utilisateur (liste des IDs)
      const favoritesCollection = db.collection('favorites');
      const userFavorites = await favoritesCollection.findOne({
        userId: user.id,
        userType: user.userType
      });
      
      return NextResponse.json({
        success: true,
        data: userFavorites ? userFavorites.animalIds : []
      });
    }
    
  } catch (error) {
    console.error('Erreur lors de la récupération des favoris:', error);
    return NextResponse.json({
      success: false,
      message: `Erreur lors de la récupération: ${error.message}`
    }, { status: 500 });
  }
}

// POST - Ajouter/Retirer un animal des favoris
export async function POST(request) {
  try {
    // Vérifier l'authentification
    const auth = await isAuthenticated();
    if (!auth.authenticated) {
      return NextResponse.json({
        success: false,
        message: 'Authentification requise'
      }, { status: 401 });
    }

    const { user } = auth;
    const { animalId, action } = await request.json(); // action: 'add' ou 'remove'
    
    if (!ObjectId.isValid(animalId)) {
      return NextResponse.json({
        success: false,
        message: 'ID d\'animal invalide'
      }, { status: 400 });
    }

    const db = await connectDB();
    const favoritesCollection = db.collection('favorites');
    
    // Rechercher le document des favoris de l'utilisateur
    const userFavorites = await favoritesCollection.findOne({
      userId: user.id,
      userType: user.userType
    });
    
    if (!userFavorites) {
      // Créer un nouveau document de favoris pour l'utilisateur
      if (action === 'add') {
        await favoritesCollection.insertOne({
          userId: user.id,
          userType: user.userType,
          animalIds: [animalId],
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
        return NextResponse.json({
          success: true,
          message: 'Animal ajouté aux favoris',
          isFavorite: true
        });
      } else {
        return NextResponse.json({
          success: true,
          message: 'Animal pas dans les favoris',
          isFavorite: false
        });
      }
    } else {
      // Mettre à jour le document existant
      const currentIds = userFavorites.animalIds || [];
      let updatedIds;
      
      if (action === 'add') {
        if (!currentIds.includes(animalId)) {
          updatedIds = [...currentIds, animalId];
        } else {
          updatedIds = currentIds;
        }
      } else if (action === 'remove') {
        updatedIds = currentIds.filter(id => id !== animalId);
      }
      
      await favoritesCollection.updateOne(
        { userId: user.id, userType: user.userType },
        { 
          $set: { 
            animalIds: updatedIds,
            updatedAt: new Date()
          }
        }
      );
      
      return NextResponse.json({
        success: true,
        message: action === 'add' ? 'Animal ajouté aux favoris' : 'Animal retiré des favoris',
        isFavorite: action === 'add'
      });
    }
    
  } catch (error) {
    console.error('Erreur lors de la modification des favoris:', error);
    return NextResponse.json({
      success: false,
      message: `Erreur lors de la modification: ${error.message}`
    }, { status: 500 });
  }
}