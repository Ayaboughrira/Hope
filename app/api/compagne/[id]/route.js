// app/api/campaigns/[id]/route.js
import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { connectDB } from '../../../config/mongodb';
import cloudinary, { deleteCloudinaryFile } from '../../../config/cloudinary';

// Récupérer une campagne spécifique
export async function GET(request, { params }) {
  try {
    const { id } = params;
    
    // Vérifier que l'ID est valide
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID de campagne invalide' }, { status: 400 });
    }
    
    const db = await connectDB();
    const campaignsCollection = db.collection('campaigns');
    
    // Récupérer la campagne par son ID
    const campaign = await campaignsCollection.findOne({ _id: new ObjectId(id) });
    
    if (!campaign) {
      return NextResponse.json({ error: 'Campagne non trouvée' }, { status: 404 });
    }
    
    return NextResponse.json({ campaign }, { status: 200 });
  } catch (error) {
    console.error('Erreur lors de la récupération de la campagne:', error);
    return NextResponse.json({ 
      error: 'Une erreur est survenue lors de la récupération de la campagne',
      details: error.message
    }, { status: 500 });
  }
}

// Mettre à jour une campagne
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    
    // Vérifier que l'ID est valide
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID de campagne invalide' }, { status: 400 });
    }
    
    const formData = await request.formData();
    
    // Extraire les données de base à mettre à jour
    const updateData = {
      title: formData.get('title'),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      startTime: formData.get('startTime'),
      location: formData.get('location'),
      description: formData.get('description'),
      objective: formData.get('objective'),
      email: formData.get('email'),
      phone: formData.get('phone') || '',
      updatedAt: new Date()
    };
    
    // Éliminer les champs vides
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === null || updateData[key] === undefined) {
        delete updateData[key];
      }
    });
    
    // Connexion à la base de données
    const db = await connectDB();
    const campaignsCollection = db.collection('campaigns');
    
    // Récupérer la campagne existante
    const existingCampaign = await campaignsCollection.findOne({ _id: new ObjectId(id) });
    
    if (!existingCampaign) {
      return NextResponse.json({ error: 'Campagne non trouvée' }, { status: 404 });
    }
    
    // Gérer les nouvelles images si présentes
    const handleImages = formData.get('handleImages');
    
    if (handleImages === 'replace') {
      // Supprimer les anciennes images de Cloudinary
      if (existingCampaign.imageIds && existingCampaign.imageIds.length > 0) {
        for (const publicId of existingCampaign.imageIds) {
          await deleteCloudinaryFile(publicId);
        }
      }
      
      // Ajouter les nouvelles images
      const imageFiles = formData.getAll('images');
      const imageUrls = [];
      const imageIds = [];
      
      if (imageFiles && imageFiles.length > 0) {
        // Limiter à 3 images
        const filesToUpload = imageFiles.slice(0, 3);
        
        for (const file of filesToUpload) {
          if (file.size > 0) {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const cloudinaryDataUri = `data:${file.type};base64,${buffer.toString('base64')}`;
            
            const uploadResult = await cloudinary.uploader.upload(cloudinaryDataUri, {
              folder: 'hope-campaigns',
              resource_type: 'image'
            });
            
            imageUrls.push(uploadResult.secure_url);
            imageIds.push(uploadResult.public_id);
          }
        }
      }
      
      updateData.imageUrls = imageUrls;
      updateData.imageIds = imageIds;
    }
    
    // Mettre à jour la campagne
    const result = await campaignsCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Campagne non trouvée' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Campagne mise à jour avec succès'
    }, { status: 200 });
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la campagne:', error);
    return NextResponse.json({ 
      error: 'Une erreur est survenue lors de la mise à jour de la campagne',
      details: error.message
    }, { status: 500 });
  }
}

// Supprimer une campagne
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    
    // Vérifier que l'ID est valide
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'ID de campagne invalide' }, { status: 400 });
    }
    
    const db = await connectDB();
    const campaignsCollection = db.collection('campaigns');
    
    // Récupérer la campagne pour avoir les IDs des images
    const campaign = await campaignsCollection.findOne({ _id: new ObjectId(id) });
    
    if (!campaign) {
      return NextResponse.json({ error: 'Campagne non trouvée' }, { status: 404 });
    }
    
    // Supprimer les images de Cloudinary
    if (campaign.imageIds && campaign.imageIds.length > 0) {
      for (const publicId of campaign.imageIds) {
        await deleteCloudinaryFile(publicId);
      }
    }
    
    // Supprimer la campagne de la base de données
    const result = await campaignsCollection.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Campagne non trouvée' }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Campagne supprimée avec succès' 
    }, { status: 200 });
    
  } catch (error) {
    console.error('Erreur lors de la suppression de la campagne:', error);
    return NextResponse.json({ 
      error: 'Une erreur est survenue lors de la suppression de la campagne',
      details: error.message
    }, { status: 500 });
  }
}