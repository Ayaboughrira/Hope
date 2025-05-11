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

// Fonction pour mapper le type d'utilisateur aux noms de collection
function mapUserTypeToCollection(userType) {
  switch (userType) {
    case 'owner':
      return 'user';
    case 'vet':
      return 'veterinaire';
    case 'association':
      return 'association';
    case 'store':
      return 'animalerie';
    default:
      return userType;
  }
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
    
    // Créer la collection si elle n'existe pas
    if (!(await db.listCollections({ name: 'animals' }).toArray()).length) {
      await db.createCollection('animals');
    }
    
    // Récupérer les données du formulaire multipart
    const formData = await request.formData();
    
    // Préparer les données pour l'animal
    const animalData = {
      animalName: formData.get('animalName'),
      animalType: formData.get('animalType'),
      race: formData.get('race'),
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

// Récupérer toutes les annonces
export async function GET(request) {
  try {
    const db = await connectDB();
    const animalsCollection = db.collection('animals');
    
    // Vérifier si un filtre est appliqué pour le type de publicateur
    const { searchParams } = new URL(request.url);
    const publishType = searchParams.get('publishType');
    const publishId = searchParams.get('publishId');
    
    let query = {};
    
    // Ajouter les filtres si spécifiés
    if (publishType) {
      query.publishType = publishType;
    }
    
    if (publishId) {
      query.publishId = publishId;
    }
    
    // Récupérer les animaux depuis la collection avec les filtres
    const animals = await animalsCollection.find(query).toArray();
    
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
    
    // Récupérer les annonces publiées par cet utilisateur
    const animals = await animalsCollection.find({ 
      publishType: user.userType,
      publishId: user.id
    }).toArray();
    
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