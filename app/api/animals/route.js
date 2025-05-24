// app/api/animals/route.js (modifié)
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

// Code complet corrigé pour la fonction POST dans app/api/animals/route.js

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
    
    // Récupérer les données du formulaire multipart
    const formData = await request.formData();
    
    // Récupérer les IDs de l'espèce et de la race
    const speciesId = formData.get('speciesId');
    const raceId = formData.get('raceId');
    
    // Vérifier que les ID sont valides
    if (!ObjectId.isValid(speciesId)) {
      return NextResponse.json({
        success: false,
        message: 'ID d\'espèce invalide'
      }, { status: 400 });
    }
    
    // Vérifier si l'espèce existe
    const speciesCollection = db.collection('species');
    const speciesDoc = await speciesCollection.findOne({ _id: new ObjectId(speciesId) });
    
    if (!speciesDoc) {
      return NextResponse.json({
        success: false,
        message: 'Espèce non trouvée dans la base de données'
      }, { status: 404 });
    }
    
    // Vérifier si la race existe (si fournie)
    let raceDoc = null;
    if (raceId && ObjectId.isValid(raceId)) {
      const racesCollection = db.collection('races');
      
      // Convertir speciesId en chaîne pour la comparaison
      const speciesIdString = speciesId.toString();
      
      console.log('Recherche de race avec:', {
        _id: new ObjectId(raceId),
        speciesId: speciesIdString
      });
      
      // Rechercher par speciesId en tant que chaîne de caractères
      raceDoc = await racesCollection.findOne({ 
        _id: new ObjectId(raceId),
        speciesId: speciesIdString
      });
      
      // Si toujours non trouvé, essayer avec d'autres formats possibles
      if (!raceDoc) {
        // Essayer de rechercher uniquement par ID de race sans vérifier l'espèce
        console.log('Race non trouvée avec speciesId en chaîne. Recherche simple par ID...');
        const simpleRaceDoc = await racesCollection.findOne({ _id: new ObjectId(raceId) });
        
        if (simpleRaceDoc) {
          console.log('Race trouvée, mais problème de correspondance avec l\'espèce:', {
            raceSpeciesId: simpleRaceDoc.speciesId,
            requestedSpeciesId: speciesIdString
          });
          
          // Accepter la race même si le format de speciesId ne correspond pas exactement
          // Cela permet d'être flexible avec les différents formats d'ID
          raceDoc = simpleRaceDoc;
        } else {
          console.log('Race introuvable par ID:', raceId);
          return NextResponse.json({
            success: false,
            message: 'Race non trouvée dans la base de données'
          }, { status: 404 });
        }
      }
    }
    
    // Préparer les données pour l'animal
    const animalData = {
      animalName: formData.get('animalName'),
      speciesId: new ObjectId(speciesId),
      speciesCode: speciesDoc.code,
      raceId: raceDoc ? new ObjectId(raceId) : null,
      raceCode: raceDoc ? raceDoc.code : null,
      raceName: raceDoc ? raceDoc.name : null,
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
      status: "available", // Statut par défaut
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

// Fonction GET corrigée pour récupérer les annonces avec cohérence dans le traitement des IDs

// app/api/animals/route.js - GET modifiée pour être cohérente avec POST
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
    
    // Gérer le speciesId de manière cohérente
    if (speciesId) {
      // Si c'est un ObjectId valide, l'utiliser comme tel
      if (ObjectId.isValid(speciesId)) {
        console.log('Recherche d\'animaux par speciesId (ObjectId):', speciesId);
        query.speciesId = new ObjectId(speciesId);
      } else {
        // Sinon, rechercher par code d'espèce
        console.log('Recherche d\'animaux par speciesCode:', speciesId);
        query.speciesCode = speciesId;
      }
    }
    
    // Gérer le raceId de manière cohérente
    if (raceId) {
      // Si c'est un ObjectId valide, l'utiliser comme tel
      if (ObjectId.isValid(raceId)) {
        console.log('Recherche d\'animaux par raceId (ObjectId):', raceId);
        query.raceId = new ObjectId(raceId);
      } else {
        // Sinon, rechercher par code de race
        console.log('Recherche d\'animaux par raceCode:', raceId);
        query.raceCode = raceId;
      }
    }
    
    console.log('Requête de recherche animaux:', JSON.stringify(query));
    
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
      },
      {
        $sort: { publishDate: -1 } // Trier par date de publication (plus récent d'abord)
      }
    ];
    
    const animals = await animalsCollection.aggregate(pipeline).toArray();
    console.log(`${animals.length} animaux trouvés`);
    
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