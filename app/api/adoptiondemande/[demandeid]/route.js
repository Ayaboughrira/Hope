// app/api/adoptiondemande/[demandeid]/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '../../../../config/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../auth/[...nextauth]/route';

// Mettre à jour le statut d'une demande d'adoption (accepter/rejeter)
export async function PATCH(request, { params }) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Non authentifié'
      }, { status: 401 });
    }
    
    // Récupérer l'ID de la demande depuis les paramètres
    const requestId = params.requestId;
    
    // Vérifier que l'ID est valide
    if (!ObjectId.isValid(requestId)) {
      return NextResponse.json({
        success: false,
        message: 'ID de demande invalide'
      }, { status: 400 });
    }
    
    // Récupérer les données de la requête
    const data = await request.json();
    
    // Vérifier les données requises
    if (!data.status || !['accepted', 'rejected'].includes(data.status)) {
      return NextResponse.json({
        success: false,
        message: 'Statut invalide. Doit être \'accepted\' ou \'rejected\''
      }, { status: 400 });
    }
    
    // Se connecter à MongoDB
    const db = await connectDB();
    const requestsCollection = db.collection('adoptionRequests');
    
    // Trouver la demande actuelle
    const currentRequest = await requestsCollection.findOne({
      _id: new ObjectId(requestId)
    });
    
    // Vérifier que la demande existe
    if (!currentRequest) {
      return NextResponse.json({
        success: false,
        message: 'Demande non trouvée'
      }, { status: 404 });
    }
    
    // Vérifier que l'utilisateur est bien le propriétaire de cette demande
    if (currentRequest.ownerId !== session.user.id) {
      return NextResponse.json({
        success: false,
        message: 'Non autorisé à traiter cette demande'
      }, { status: 403 });
    }
    
    // Mise à jour de la demande
    const updateResult = await requestsCollection.updateOne(
      { _id: new ObjectId(requestId) },
      {
        $set: {
          status: data.status,
          responseMessage: data.responseMessage || '',
          updatedAt: new Date()
        }
      }
    );
    
    if (updateResult.modifiedCount === 0) {
      return NextResponse.json({
        success: false,
        message: 'Échec de la mise à jour'
      }, { status: 500 });
    }
    
    // Si la demande est acceptée, mettre à jour l'animal comme adopté ou en cours d'adoption
    if (data.status === 'accepted') {
      const animalsCollection = db.collection('animals');
      
      await animalsCollection.updateOne(
        { _id: new ObjectId(currentRequest.animalId) },
        {
          $set: {
            adoptionStatus: 'in_progress', // ou 'adopted' selon la logique métier
            adopterId: currentRequest.requesterId,
            updatedAt: new Date()
          }
        }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: `Demande ${data.status === 'accepted' ? 'acceptée' : 'rejetée'} avec succès`
    });
    
  } catch (error) {
    console.error('Erreur lors du traitement de la demande d\'adoption:', error);
    return NextResponse.json({
      success: false,
      message: `Erreur: ${error.message}`
    }, { status: 500 });
  }
}

// Récupérer les détails d'une demande spécifique
export async function GET(request, { params }) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Non authentifié'
      }, { status: 401 });
    }
    
    // Récupérer l'ID de la demande depuis les paramètres
    const requestId = params.requestId;
    
    // Vérifier que l'ID est valide
    if (!ObjectId.isValid(requestId)) {
      return NextResponse.json({
        success: false,
        message: 'ID de demande invalide'
      }, { status: 400 });
    }
    
    // Se connecter à MongoDB
    const db = await connectDB();
    const requestsCollection = db.collection('adoptionRequests');
    
    // Trouver la demande
    const adoptionRequest = await requestsCollection.findOne({
      _id: new ObjectId(requestId)
    });
    
    // Vérifier que la demande existe
    if (!adoptionRequest) {
      return NextResponse.json({
        success: false,
        message: 'Demande non trouvée'
      }, { status: 404 });
    }
    
    // Vérifier que l'utilisateur est autorisé à voir cette demande
    // (soit c'est le propriétaire, soit c'est le demandeur)
    if (adoptionRequest.ownerId !== session.user.id && adoptionRequest.requesterId !== session.user.id) {
      return NextResponse.json({
        success: false,
        message: 'Non autorisé à accéder à cette demande'
      }, { status: 403 });
    }
    
    return NextResponse.json({
      success: true,
      data: adoptionRequest
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération de la demande d\'adoption:', error);
    return NextResponse.json({
      success: false,
      message: `Erreur: ${error.message}`
    }, { status: 500 });
  }
}