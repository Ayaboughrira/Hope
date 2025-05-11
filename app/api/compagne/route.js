// app/api/campaigns/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '../../config/mongodb';
import cloudinary from '../../config/cloudinary';

// Fonction pour gérer les requêtes POST
export async function POST(request) {
  try {
    // Récupérer les données du formulaire
    const formData = await request.formData();
    
    // Extraire les données de base
    const campaignData = {
      title: formData.get('title'),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      startTime: formData.get('startTime'),
      location: formData.get('location'),
      description: formData.get('description'),
      objective: formData.get('objective'),
      email: formData.get('email'),
      phone: formData.get('phone') || '',
      createdAt: new Date(),
      imageUrls: [],
      imageIds: []
    };

    // Validation des champs obligatoires
    const requiredFields = ['title', 'startDate', 'endDate', 'startTime', 'location', 'description', 'objective', 'email'];
    for (const field of requiredFields) {
      if (!campaignData[field]) {
        return NextResponse.json(
          { error: `Le champ ${field} est obligatoire` },
          { status: 400 }
        );
      }
    }

    // Validation de l'email
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(campaignData.email)) {
      return NextResponse.json(
        { error: "L'adresse email est invalide" },
        { status: 400 }
      );
    }

    // Traitement des images (jusqu'à 3)
    const imageFiles = formData.getAll('images');
    
    if (imageFiles && imageFiles.length > 0) {
      // Limiter à 3 images
      const filesToUpload = imageFiles.slice(0, 3);
      
      // Uploader les images sur Cloudinary
      for (const file of filesToUpload) {
        if (file.size > 0) {
          // Convertir le fichier en buffer pour Cloudinary
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          // Créer un format de données pour Cloudinary
          const cloudinaryDataUri = `data:${file.type};base64,${buffer.toString('base64')}`;
          
          // Uploader l'image sur Cloudinary
          const uploadResult = await cloudinary.uploader.upload(cloudinaryDataUri, {
            folder: 'hope-campaigns',  // Dossier pour organiser les images
            resource_type: 'image'
          });
          
          // Ajouter l'URL et l'ID de l'image aux données de la campagne
          campaignData.imageUrls.push(uploadResult.secure_url);
          campaignData.imageIds.push(uploadResult.public_id);
        }
      }
    }

    // Connexion à la base de données
    const db = await connectDB();
    const campaignsCollection = db.collection('campaigns');
    
    // Insérer la campagne dans la base de données
    const result = await campaignsCollection.insertOne(campaignData);
    
    // Retourner la réponse avec le nouvel ID
    return NextResponse.json({ 
      success: true, 
      message: 'Campagne créée avec succès', 
      campaignId: result.insertedId 
    }, { status: 201 });
    
  } catch (error) {
    console.error('Erreur lors de la création de la campagne:', error);
    return NextResponse.json({ 
      error: 'Une erreur est survenue lors de la création de la campagne',
      details: error.message
    }, { status: 500 });
  }
}

// Fonction pour récupérer toutes les campagnes
export async function GET() {
  try {
    const db = await connectDB();
    const campaignsCollection = db.collection('campaigns');
    
    // Récupérer toutes les campagnes, triées par date de création (les plus récentes d'abord)
    const campaigns = await campaignsCollection.find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    return NextResponse.json({ campaigns }, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la récupération des campagnes:', error);
    return NextResponse.json({ 
      error: 'Une erreur est survenue lors de la récupération des campagnes',
      details: error.message
    }, { status: 500 });
  }
}