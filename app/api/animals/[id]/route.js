// app/api/animals/[id]/route.js
import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

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

// Récupérer un animal spécifique avec toutes les informations détaillées
export async function GET(request, { params }) {
  try {
    // Récupérer l'ID depuis les paramètres
    const id = params.id;

    // Vérifier que l'ID est valide
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        message: 'ID d\'animal invalide'
      }, { status: 400 });
    }

    // Se connecter à MongoDB
    const db = await connectDB();
    const animalsCollection = db.collection('animals');
    
    // Pipeline d'agrégation pour joindre les informations d'espèce et de race
    const pipeline = [
      { 
        $match: { 
          _id: new ObjectId(id) 
        } 
      },
      // Première tentative de lookup avec speciesId comme ObjectId
      {
        $lookup: {
          from: 'species',
          localField: 'speciesId',
          foreignField: '_id',
          as: 'speciesDetails'
        }
      },
      // Si la première tentative ne donne rien, essayer avec speciesCode
      {
        $lookup: {
          from: 'species',
          localField: 'speciesCode',
          foreignField: 'code',
          as: 'speciesCodeDetails'
        }
      },
      // Combiner les résultats des deux lookups
      {
        $addFields: {
          speciesDetails: {
            $cond: {
              if: { $eq: [{ $size: '$speciesDetails' }, 0] },
              then: '$speciesCodeDetails',
              else: '$speciesDetails'
            }
          }
        }
      },
      {
        $unwind: {
          path: '$speciesDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      // Suppression du champ temporaire
      {
        $project: {
          speciesCodeDetails: 0
        }
      },
      // Même approche pour les races
      {
        $lookup: {
          from: 'races',
          localField: 'raceId',
          foreignField: '_id',
          as: 'raceDetails'
        }
      },
      {
        $lookup: {
          from: 'races',
          localField: 'raceCode',
          foreignField: 'code',
          as: 'raceCodeDetails'
        }
      },
      {
        $addFields: {
          raceDetails: {
            $cond: {
              if: { $eq: [{ $size: '$raceDetails' }, 0] },
              then: '$raceCodeDetails',
              else: '$raceDetails'
            }
          }
        }
      },
      {
        $unwind: {
          path: '$raceDetails',
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          raceCodeDetails: 0
        }
      }
    ];
    
    // Exécuter le pipeline d'agrégation
    const animals = await animalsCollection.aggregate(pipeline).toArray();
    
    // Vérifier si l'animal a été trouvé
    if (!animals || animals.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'Animal non trouvé'
      }, { status: 404 });
    }
    
    // Renvoyer l'animal avec toutes ses informations détaillées
    return NextResponse.json({ 
      success: true, 
      data: animals[0] 
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'animal:', error);
    return NextResponse.json({
      success: false,
      message: `Erreur lors de la récupération de l'animal: ${error.message}`
    }, { status: 500 });
  }
}

// Mettre à jour un animal spécifique
export async function PUT(request, { params }) {
  try {
    // Récupérer l'ID depuis les paramètres
    const id = params.id;

    // Vérifier que l'ID est valide
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        message: 'ID d\'animal invalide'
      }, { status: 400 });
    }

    // Récupérer les données de la requête
    const updateData = await request.json();
    
    // Se connecter à MongoDB
    const db = await connectDB();
    const animalsCollection = db.collection('animals');
    
    // Mettre à jour l'animal
    const result = await animalsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'Animal non trouvé'
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Animal mis à jour avec succès',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour de l\'animal:', error);
    return NextResponse.json({
      success: false,
      message: `Erreur lors de la mise à jour de l'animal: ${error.message}`
    }, { status: 500 });
  }
}

// Supprimer un animal spécifique
export async function DELETE(request, { params }) {
  try {
    // Récupérer l'ID depuis les paramètres
    const id = params.id;
    
    // Récupérer les informations du propriétaire à partir de la requête
    const { userId, userType } = await request.json();
    
    // Vérifier que l'ID est valide
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        message: 'ID d\'animal invalide'
      }, { status: 400 });
    }

    // Se connecter à MongoDB
    const db = await connectDB();
    const animalsCollection = db.collection('animals');
    
    // D'abord vérifier que l'utilisateur est le propriétaire de l'annonce
    const animal = await animalsCollection.findOne({ 
      _id: new ObjectId(id),
      publishId: userId,
      publishType: userType // Vérification du propriétaire
    });
    
    if (!animal) {
      return NextResponse.json({
        success: false,
        message: 'Animal non trouvé ou vous n\'êtes pas autorisé à le supprimer'
      }, { status: 403 });
    }
    
    // Supprimer l'animal
    const result = await animalsCollection.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'Échec de la suppression de l\'animal'
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Animal supprimé avec succès du catalogue' 
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'animal:', error);
    return NextResponse.json({
      success: false,
      message: `Erreur lors de la suppression de l'animal: ${error.message}`
    }, { status: 500 });
  }
}