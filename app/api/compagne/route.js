// app/api/campagne/route.js
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectDB } from '../../config/mongodb';
import cloudinary from '../../config/cloudinary';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.userType !== 'association') {
      return NextResponse.json(
        { error: 'Accès non autorisé. Seules les associations peuvent créer des campagnes.' },
        { status: 403 }
      );
    }

    // Connexion à la base de données
    const db = await connectDB();
    
    // Récupérer les informations de l'association
    const association = await db.collection('association').findOne({
      _id: new ObjectId(session.user.id)
    });

    if (!association) {
      return NextResponse.json(
        { error: 'Association non trouvée' },
        { status: 404 }
      );
    }

    // Parser les données du formulaire
    const formData = await request.formData();
    
    const campaignData = {
      title: formData.get('title'),
      startDate: formData.get('startDate'),
      endDate: formData.get('endDate'),
      startTime: formData.get('startTime'),
      location: formData.get('location'),
      description: formData.get('description'),
      objective: formData.get('objective'),
      email: formData.get('email'),
      phone: formData.get('phone'),
    };

    // Validation des données requises
    const requiredFields = ['title', 'startDate', 'endDate', 'startTime', 'location', 'description', 'objective', 'email'];
    for (const field of requiredFields) {
      if (!campaignData[field]) {
        return NextResponse.json(
          { error: `Le champ ${field} est requis` },
          { status: 400 }
        );
      }
    }

    // Traitement des images
    const images = formData.getAll('images');
    const imageUrls = [];

    if (images && images.length > 0) {
      for (const image of images) {
        if (image.size > 0) {
          try {
            // Convertir en buffer
            const bytes = await image.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Uploader vers Cloudinary
            const uploadResult = await new Promise((resolve, reject) => {
              cloudinary.uploader.upload_stream(
                {
                  resource_type: 'image',
                  folder: 'campaigns',
                  transformation: [
                    { width: 800, height: 600, crop: 'fill' }
                  ]
                },
                (error, result) => {
                  if (error) reject(error);
                  else resolve(result);
                }
              ).end(buffer);
            });

            imageUrls.push({
              url: uploadResult.secure_url,
              publicId: uploadResult.public_id
            });
          } catch (uploadError) {
            console.error('Erreur upload image:', uploadError);
          }
        }
      }
    }

    // Créer l'objet campagne complet
    const newCampaign = {
      ...campaignData,
      images: imageUrls,
      associationId: new ObjectId(session.user.id),
      associationName: association.associationName,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
      participantsIds: [] // IDs des participants
    };

    // Insérer la campagne dans la base de données
    const result = await db.collection('campaigns').insertOne(newCampaign);

    return NextResponse.json({
      message: 'Campagne créée avec succès',
      campaignId: result.insertedId
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur lors de la création de la campagne:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    // Connexion à la base de données
    const db = await connectDB();
    
    // Récupérer toutes les campagnes actives avec les informations des associations
    const campaigns = await db.collection('campaigns').aggregate([
      {
        $match: { status: 'active' }
      },
      {
        $lookup: {
          from: 'association',
          localField: 'associationId',
          foreignField: '_id',
          as: 'associationInfo'
        }
      },
      {
        $addFields: {
          association: {
            $arrayElemAt: ['$associationInfo.associationName', 0]
          }
        }
      },
      {
        $project: {
          associationInfo: 0 // Exclure les détails complets de l'association
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ]).toArray();

    // Formatter les données pour le frontend
    const formattedCampaigns = campaigns.map(campaign => ({
      id: campaign._id.toString(),
      name: campaign.title,
      association: campaign.association || campaign.associationName,
      location: campaign.location,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      startTime: campaign.startTime,
      description: campaign.description,
      objective: campaign.objective,
      shortDescription: campaign.description.substring(0, 150) + '...',
      image: campaign.images && campaign.images.length > 0 ? campaign.images[0].url : '/api/placeholder/400/300',
      images: campaign.images || [],
      email: campaign.email,
      phone: campaign.phone,
      createdAt: campaign.createdAt
    }));

    return NextResponse.json(formattedCampaigns);

  } catch (error) {
    console.error('Erreur lors de la récupération des campagnes:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des campagnes' },
      { status: 500 }
    );
  }
}