// app/api/animals/route.js
import { MongoClient, ObjectId } from 'mongodb';
import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';
import { Readable } from 'stream';
import { createAnimalObject, validateAnimal } from '../../models/animals';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

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

// Configuration de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Fonction pour uploader un buffer vers Cloudinary
async function uploadToCloudinary(buffer, fileType) {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: 'hope_animals',
      resource_type: fileType
    };

    // Créer un stream à partir du buffer
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.pipe(uploadStream);
  });
}

// Fonction pour vérifier si l'utilisateur est authentifié
async function isAuthenticated(request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return { authenticated: false };
  }
  return { 
    authenticated: true,
    user: session.user
  };
}

export async function POST(request) {
  try {
    // Vérifier l'authentification
    const auth = await isAuthenticated(request);
    if (!auth.authenticated) {
      return NextResponse.json({
        success: false,
        message: 'Authentification requise pour publier une annonce'
      }, { status: 401 });
    }
    
    const { user } = auth;
    
    // Se connecter à MongoDB
    const db = await connectDB();
    
    // Créer les collections si elles n'existent pas
    for (const collection of ['animals', 'species', 'races']) {
      if (!(await db.listCollections({ name: collection }).toArray()).length) {
        await db.createCollection(collection);
      }
    }
    
    // Récupérer les données du formulaire multipart
    const formData = await request.formData();
    
    // Récupérer les IDs de l'espèce et de la race
    const speciesId = formData.get('speciesId');
    const raceId = formData.get('raceId');
    
    // Vérifier et récupérer l'espèce (ou la créer si elle n'existe pas)
    const speciesCollection = db.collection('species');
    let speciesObjectId;
    let speciesDoc;
    
    // Recherche l'espèce par son code (dog, cat, etc.)
    speciesDoc = await speciesCollection.findOne({ code: speciesId });
    
    if (!speciesDoc) {
      // Si l'espèce n'existe pas, on la crée
      const speciesName = getSpeciesName(speciesId);
      
      const insertResult = await speciesCollection.insertOne({
        code: speciesId,
        name: speciesName,
        createdAt: new Date()
      });
      
      speciesObjectId = insertResult.insertedId;
      speciesDoc = { _id: speciesObjectId, code: speciesId, name: speciesName };
    } else {
      speciesObjectId = speciesDoc._id;
    }
    
    // Vérifier et récupérer la race (ou la créer si elle n'existe pas)
    let raceObjectId = null;
    
    if (raceId) {
      const racesCollection = db.collection('races');
      let raceDoc;
      
      // Recherche la race par son code (dog_labrador, etc.)
      raceDoc = await racesCollection.findOne({ 
        code: raceId,
        speciesCode: speciesId
      });
      
      if (!raceDoc) {
        // Si la race n'existe pas, on la crée
        const raceName = getRaceName(raceId);
        
        const insertResult = await racesCollection.insertOne({
          code: raceId,
          name: raceName,
          speciesCode: speciesId,
          speciesId: speciesObjectId,
          createdAt: new Date()
        });
        
        raceObjectId = insertResult.insertedId;
      } else {
        raceObjectId = raceDoc._id;
      }
    }
    
    // Préparer les données pour l'animal
    const animalData = {
      animalName: formData.get('animalName'),
      speciesId: speciesObjectId,  // Utiliser l'ObjectId MongoDB de l'espèce
      speciesCode: speciesId,      // Conserver aussi le code d'origine pour référence
      raceId: raceObjectId,        // Utiliser l'ObjectId MongoDB de la race
      raceCode: raceId || null,    // Conserver aussi le code d'origine pour référence
      age: formData.get('age'),
      gender: formData.get('gender'),
      description: formData.get('description'),
      ownerName: formData.get('ownerName'),
      ownerEmail: formData.get('ownerEmail'),
      ownerPhone: formData.get('ownerPhone'),
      ownerAddress: formData.get('ownerAddress'),
      photos: [],
      // Ajouter les informations sur le publicateur
      publishType: user.userType,
      publishId: user.id,
      publishDate: new Date(),
    };

    // Traiter les photos
    const photoFiles = formData.getAll('photos');
    
    if (photoFiles && photoFiles.length > 0) {
      for (const photoFile of photoFiles) {
         if (photoFile && typeof photoFile.arrayBuffer === 'function') {
          // Convertir le fichier en ArrayBuffer puis en Buffer
          const arrayBuffer = await photoFile.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          // Upload sur Cloudinary
          const result = await uploadToCloudinary(buffer, 'image');
          
          // Ajouter l'URL à notre document
          animalData.photos.push({
            url: result.secure_url,
            publicId: result.public_id
          });
        }
      }
    }

    // Créer l'objet animal avec notre modèle
    const animalInfo = createAnimalObject(animalData);
    
    // Valider l'objet animal
    try {
      validateAnimal(animalInfo);
    } catch (validationError) {
      return NextResponse.json({
        success: false,
        message: validationError.message
      }, { status: 400 });
    }

    // Insérer dans MongoDB
    const animalsCollection = db.collection('animals');
    const insertResult = await animalsCollection.insertOne(animalInfo);

    // Répondre avec un succès
    return NextResponse.json({
      success: true,
      message: 'Annonce publiée avec succès',
      animalId: insertResult.insertedId
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur lors du traitement de l\'annonce:', error);
    
    return NextResponse.json({
      success: false,
      message: `Erreur lors de la publication: ${error.message}`
    }, { status: 500 });
  }
}

// Fonction auxiliaire pour obtenir le nom de l'espèce à partir de son code
function getSpeciesName(speciesCode) {
  const speciesMap = {
    'dog': 'Chien',
    'cat': 'Chat',
    'bird': 'Oiseau'
  };
  return speciesMap[speciesCode] || speciesCode;
}

// Fonction auxiliaire pour obtenir le nom de la race à partir de son code
function getRaceName(raceCode) {
  const raceMap = {
    // Races de chiens
    'dog_labrador': 'Labrador Retriever',
    'dog_germanshepherd': 'Berger Allemand',
    'dog_goldenretriever': 'Golden Retriever',
    'dog_bulldog': 'Bulldog',
    'dog_beagle': 'Beagle',
    'dog_poodle': 'Caniche',
    
    // Races de chats
    'cat_persian': 'Persan',
    'cat_siamese': 'Siamois',
    'cat_mainecoon': 'Maine Coon',
    'cat_ragdoll': 'Ragdoll',
    'cat_bengal': 'Bengal',
    'cat_sphynx': 'Sphynx',
    
    // Races d'oiseaux
    'bird_canary': 'Canari',
    'bird_parakeet': 'Perruche',
    'bird_cockatiel': 'Cockatiel',
    'bird_lovebird': 'Inséparable',
    'bird_finch': 'Pinson',
    'bird_parrot': 'Perroquet'
  };
  return raceMap[raceCode] || raceCode;
}

// Récupérer toutes les annonces avec informations détaillées sur l'espèce et la race
export async function GET(request) {
  try {
    const db = await connectDB();
    const animalsCollection = db.collection('animals');
    
    // Vérifier si un filtre est appliqué
    const { searchParams } = new URL(request.url);
    const publishType = searchParams.get('publishType');
    const publishId = searchParams.get('publishId');
    const speciesId = searchParams.get('speciesId');
    const raceId = searchParams.get('raceId');
    
    let query = {};
    
    // Ajouter les filtres si spécifiés
    if (publishType) {
      query.publishType = publishType;
    }
    
    if (publishId) {
      query.publishId = publishId;
    }
    
    if (speciesId) {
      // Recherche par code d'espèce ou par ObjectId si c'est un format valide
      if (ObjectId.isValid(speciesId)) {
        query.speciesId = new ObjectId(speciesId);
      } else {
        query.speciesCode = speciesId;
      }
    }
    
    if (raceId) {
      // Recherche par code de race ou par ObjectId si c'est un format valide
      if (ObjectId.isValid(raceId)) {
        query.raceId = new ObjectId(raceId);
      } else {
        query.raceCode = raceId;
      }
    }
    
    // Pipeline d'agrégation pour joindre les informations d'espèce et de race
    const pipeline = [
      { $match: query },
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
    console.error('Erreur lors de la récupération des animaux:', error);
    return NextResponse.json({
      success: false,
      message: `Erreur lors de la récupération des animaux: ${error.message}`
    }, { status: 500 });
  }
}

// Route pour récupérer les annonces d'un utilisateur spécifique
export async function GET_MY_ANIMALS(request) {
  try {
    // Vérifier l'authentification
    const auth = await isAuthenticated(request);
    if (!auth.authenticated) {
      return NextResponse.json({
        success: false,
        message: 'Authentification requise pour accéder à vos annonces'
      }, { status: 401 });
    }
    
    const { user } = auth;
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