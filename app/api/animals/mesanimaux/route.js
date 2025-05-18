// app/api/animals/mesanimaux/route.js
import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

const uri = process.env.MONGODB_URI;

// Cache la connexion
let client;
let db;

export async function connectDB() {
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

// Ferme la connexion quand l'application se termine
process.on('SIGTERM', async () => {
    if (client) await client.close();
    console.log('Connexion MongoDB fermée');
});

// Route pour récupérer les annonces d'un utilisateur spécifique
export async function GET(request) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({
        success: false,
        message: 'Authentification requise pour accéder à vos annonces'
      }, { status: 401 });
    }
    
    const user = session.user;
    const db = await connectDB();
    const animalsCollection = db.collection('animals');
    
    // Pipeline d'agrégation pour joindre les informations d'espèce et de race
    const pipeline = [
      { 
        $match: { 
          publishType: user.userType,
          publishId: user.id
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
  } catch (error) {
    console.error('Erreur lors de la récupération de vos animaux:', error);
    return NextResponse.json({
      success: false,
      message: `Erreur: ${error.message}`
    }, { status: 500 });
  }
}