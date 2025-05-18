// app/api/adoptiondemande/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '../../config/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

export async function POST(request) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Non authentifié'
      }, { status: 401 });
    }
    
    // Récupérer les données de la demande
    const data = await request.json();
    
    // Vérifier les données requises
    const requiredFields = ['animalId', 'ownerId', 'message', 'animalName'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json({
          success: false,
          message: `Le champ '${field}' est requis`
        }, { status: 400 });
      }
    }
    
    // Se connecter à MongoDB
    const db = await connectDB();
    const requestsCollection = db.collection('adoptionRequests');
    
    // Créer l'objet de demande
    const adoptionRequest = {
      animalId: data.animalId,
      ownerId: data.ownerId,
      ownerType: data.ownerType, // Type du propriétaire (owner, vet, association, store)
      requesterId: session.user.id,
      requesterEmail: session.user.email,
      requesterName: session.user.name,
      message: data.message,
      animalName: data.animalName,
      animalSpecies: data.animalSpecies,
      animalImage: data.animalImage,
      status: 'pending', // pending, accepted, rejected
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insérer la demande
    const result = await requestsCollection.insertOne(adoptionRequest);
    
    if (!result.insertedId) {
      throw new Error('Échec de l\'insertion de la demande');
    }
    
    return NextResponse.json({
      success: true,
      message: 'Demande d\'adoption envoyée avec succès',
      requestId: result.insertedId
    });
    
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la demande d\'adoption:', error);
    return NextResponse.json({
      success: false,
      message: `Erreur: ${error.message}`
    }, { status: 500 });
  }
}

// Route pour récupérer les demandes d'adoption pour un propriétaire
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
    
    // Créer le filtre de base (toujours filtrer par propriétaire connecté)
    const filter = { ownerId: session.user.id };
    
    // Ajouter le filtre de statut si fourni
    if (status && ['pending', 'accepted', 'rejected'].includes(status)) {
      filter.status = status;
    }
    
    // Se connecter à MongoDB
    const db = await connectDB();
    const requestsCollection = db.collection('adoptionRequests');
    
    // Récupérer les demandes
    const requests = await requestsCollection.find(filter)
      .sort({ createdAt: -1 }) // Du plus récent au plus ancien
      .toArray();
    
    return NextResponse.json({
      success: true,
      data: requests
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des demandes d\'adoption:', error);
    return NextResponse.json({
      success: false,
      message: `Erreur: ${error.message}`
    }, { status: 500 });
  }
}