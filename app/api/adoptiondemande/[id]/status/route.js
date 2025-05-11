// app/api/adoption-requests/[id]/status/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '../../../../../config/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../auth/[...nextauth]/route';

// Mettre à jour le statut d'une demande d'adoption (accepter ou rejeter)
export async function PATCH(request, { params }) {
  try {
    // Vérifier l'authentification de l'utilisateur
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Non autorisé. Veuillez vous connecter pour effectuer cette action.'
      }, { status: 401 });
    }

    // Récupérer l'ID de la demande d'adoption
    const requestId = params.id;
    if (!ObjectId.isValid(requestId)) {
      return NextResponse.json({
        success: false,
        message: 'ID de demande d\'adoption invalide'
      }, { status: 400 });
    }

    // Récupérer les données de la requête
    const { status, message } = await request.json();
    
    // Valider le statut
    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({
        success: false,
        message: 'Statut invalide. Les valeurs acceptées sont "approved" ou "rejected".'
      }, { status: 400 });
    }

    // Se connecter à la base de données
    const db = await connectDB();
    
    // Vérifier que l'utilisateur est bien le propriétaire de l'animal
    const adoptionRequest = await db.collection('adoptionRequests').findOne({
      _id: new ObjectId(requestId)
    });

    if (!adoptionRequest) {
      return NextResponse.json({
        success: false,
        message: 'Demande d\'adoption non trouvée'
      }, { status: 404 });
    }

    // Vérifier que l'utilisateur est bien le propriétaire
    if (adoptionRequest.ownerId !== session.user.id) {
      return NextResponse.json({
        success: false,
        message: 'Non autorisé. Vous n\'êtes pas le propriétaire de cet animal.'
      }, { status: 403 });
    }

    // Mettre à jour le statut de la demande
    const result = await db.collection('adoptionRequests').updateOne(
      { _id: new ObjectId(requestId) },
      { 
        $set: { 
          status: status,
          responseMessage: message || '',
          updatedAt: new Date()
        } 
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'Aucune modification n\'a été apportée'
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Demande d'adoption ${status === 'approved' ? 'acceptée' : 'rejetée'} avec succès`
    });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du statut de la demande d\'adoption:', error);
    return NextResponse.json({
      success: false,
      message: `Une erreur est survenue: ${error.message}`
    }, { status: 500 });
  }
}