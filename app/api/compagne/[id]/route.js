// app/api/compagne/[id]/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '../../../config/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request, { params }) {
  try {
    // Connexion à la base de données
    const db = await connectDB();
    const campaignId = params.id;

    // Vérifier si l'ID est valide
    if (!ObjectId.isValid(campaignId)) {
      return NextResponse.json(
        { error: 'ID de campagne invalide' },
        { status: 400 }
      );
    }

    // Récupérer la campagne spécifique avec les informations complètes de l'association
    const campaign = await db.collection('campaigns').aggregate([
      {
        $match: {
          _id: new ObjectId(campaignId),
          status: 'active'
        }
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
          // Données de l'association
          association: {
            $arrayElemAt: ['$associationInfo.associationName', 0]
          },
          associationEmail: {
            $arrayElemAt: ['$associationInfo.email', 0]
          },
          associationPhone: {
            $arrayElemAt: ['$associationInfo.phone', 0]
          },
          associationAddress: {
            $arrayElemAt: ['$associationInfo.address', 0]
          }
        }
      },
      {
        $project: {
          associationInfo: 0 // Exclure les détails complets de l'association
        }
      }
    ]).toArray();

    if (campaign.length === 0) {
      return NextResponse.json(
        { error: 'Campagne non trouvée' },
        { status: 404 }
      );
    }

    const foundCampaign = campaign[0];

    // Formatter les données pour le frontend
    const formattedCampaign = {
      id: foundCampaign._id.toString(),
      name: foundCampaign.title,
      association: foundCampaign.association || foundCampaign.associationName,
      location: foundCampaign.location,
      startDate: foundCampaign.startDate,
      endDate: foundCampaign.endDate,
      startTime: foundCampaign.startTime,
      description: foundCampaign.description,
      objective: foundCampaign.objective,
      image: foundCampaign.images && foundCampaign.images.length > 0 
        ? foundCampaign.images[0].url 
        : '/api/placeholder/400/300',
      images: foundCampaign.images || [],
      
      // Informations de contact - priorité : campagne > association
      email: foundCampaign.email || foundCampaign.associationEmail,
      phone: foundCampaign.phone || foundCampaign.associationPhone,
      address: foundCampaign.address || foundCampaign.associationAddress,
      
      // Informations supplémentaires
      associationId: foundCampaign.associationId?.toString(),
      createdAt: foundCampaign.createdAt,
      participantsCount: foundCampaign.participantsIds ? foundCampaign.participantsIds.length : 0
    };

    return NextResponse.json(formattedCampaign);

  } catch (error) {
    console.error('Erreur lors de la récupération de la campagne:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}

// API pour mettre à jour une campagne (pour les associations)
export async function PUT(request, { params }) {
  try {
    const campaignId = params.id;
    const updateData = await request.json();

    if (!ObjectId.isValid(campaignId)) {
      return NextResponse.json(
        { error: 'ID de campagne invalide' },
        { status: 400 }
      );
    }

    const db = await connectDB();

    // Mettre à jour la campagne
    const result = await db.collection('campaigns').updateOne(
      { _id: new ObjectId(campaignId) },
      { 
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Campagne non trouvée' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Campagne mise à jour avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour de la campagne:', error);
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    );
  }
}