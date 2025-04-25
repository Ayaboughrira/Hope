import { MongoClient } from 'mongodb';
import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';
import { Readable } from 'stream';
import { createAnimalObject, validateAnimal } from '../../models/animals';


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

export async function POST(request) {
  try {
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
      videoUrl: '',
      videoPublicId: ''
    };

    // Traiter les photos
    const photoFiles = formData.getAll('photos');
    
    if (photoFiles && photoFiles.length > 0) {
      for (const photoFile of photoFiles) {
        if (photoFile instanceof File) {
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

    // Traiter la vidéo si elle existe
    const videoFile = formData.get('video');
    if (videoFile instanceof File) {
      const arrayBuffer = await videoFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Upload sur Cloudinary
      const result = await uploadToCloudinary(buffer, 'video');
      
      // Ajouter l'URL à notre document
      animalData.videoUrl = result.secure_url;
      animalData.videoPublicId = result.public_id;
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