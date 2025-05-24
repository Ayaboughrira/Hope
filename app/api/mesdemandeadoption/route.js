// app/api/mesdemandesadoption/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '../../config/mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

// Route pour récupérer les demandes d'adoption envoyées par l'utilisateur connecté
export async function GET(request) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Non authentifié'
      }, { status: 401 });
    }
    
    // Récupérer les paramètres de recherche
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    // Créer le filtre de base (filtrer par demandeur connecté - requesterId)
    const filter = { requesterId: session.user.id };
    
    // Ajouter le filtre de statut si fourni et différent de 'all'
    if (status && status !== 'all' && ['pending', 'accepted', 'rejected'].includes(status)) {
      filter.status = status;
    }
    
    // Se connecter à MongoDB
    const db = await connectDB();
    const requestsCollection = db.collection('adoptionRequests');
    
    // Récupérer les demandes avec informations supplémentaires du propriétaire
    const requests = await requestsCollection.aggregate([
      // Filtrer par demandeur
      { $match: filter },
      
      // Joindre avec la collection users pour obtenir les infos du propriétaire
      {
        $lookup: {
          from: 'users',
          localField: 'ownerId',
          foreignField: 'id', // ou '_id' selon votre structure
          as: 'ownerInfo'
        }
      },
      
      // Ajouter les informations du propriétaire
      {
        $addFields: {
          ownerName: { $arrayElemAt: ['$ownerInfo.name', 0] },
          ownerEmail: { $arrayElemAt: ['$ownerInfo.email', 0] }
        }
      },
      
      // Supprimer le champ ownerInfo qui n'est plus nécessaire
      {
        $unset: 'ownerInfo'
      },
      
      // Trier du plus récent au plus ancien
      { $sort: { createdAt: -1 } }
    ]).toArray();
    
    return NextResponse.json({
      success: true,
      data: requests,
      total: requests.length
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération de vos demandes d\'adoption:', error);
    return NextResponse.json({
      success: false,
      message: `Erreur: ${error.message}`
    }, { status: 500 });
  }
}