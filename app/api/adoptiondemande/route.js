// app/api/adoption-requests/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '../../config/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

// Créer une nouvelle demande d'adoption
export async function POST(request) {
  try {
    // Vérifier l'authentification de l'utilisateur
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Non autorisé. Veuillez vous connecter pour effectuer cette action.'
      }, { status: 401 });
    }

    // Récupérer les données de la demande
    const requestData = await request.json();
    
    // Valider les données requises
    if (!requestData.animalId || !requestData.ownerId || !requestData.requesterId) {
      return NextResponse.json({
        success: false,
        message: 'Données incomplètes pour la demande d\'adoption'
      }, { status: 400 });
    }

    // Vérifier que l'utilisateur n'est pas le propriétaire de l'animal
    if (requestData.ownerId === session.user.id) {
      return NextResponse.json({
        success: false,
        message: 'Vous ne pouvez pas faire une demande d\'adoption pour votre propre animal'
      }, { status: 400 });
    }

    // Se connecter à la base de données
    const db = await connectDB();
    
    // Structure de la demande d'adoption
    const adoptionRequest = {
      animalId: requestData.animalId,
      ownerId: requestData.ownerId,
      requesterId: requestData.requesterId,
      requesterEmail: requestData.requesterEmail,
      requesterName: requestData.requesterName,
      message: requestData.message,
      animalName: requestData.animalName,
      animalSpecies: requestData.animalSpecies,
      animalImage: requestData.animalImage,
      status: 'pending', // 'pending', 'approved', 'rejected'
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insérer la demande d'adoption dans la base de données
    const result = await db.collection('adoptionRequests').insertOne(adoptionRequest);

    if (!result.insertedId) {
      throw new Error('Échec de l\'enregistrement de la demande d\'adoption');
    }

    return NextResponse.json({
      success: true,
      message: 'Demande d\'adoption envoyée avec succès',
      requestId: result.insertedId
    }, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de la demande d\'adoption:', error);
    return NextResponse.json({
      success: false,
      message: `Une erreur est survenue: ${error.message}`
    }, { status: 500 });
  }
}

// Récupérer les demandes d'adoption pour un utilisateur (propriétaire de l'animal)
export async function GET(request) {
  try {
    // Vérifier l'authentification de l'utilisateur
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({
        success: false,
        message: 'Non autorisé. Veuillez vous connecter pour effectuer cette action.'
      }, { status: 401 });
    }

    // Récupérer l'ID utilisateur de la session
    const userId = session.user.id;
    
    // Récupérer les paramètres de l'URL
    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'all'; // 'all', 'pending', 'approved', 'rejected'
    
    // Se connecter à la base de données
    const db = await connectDB();
    
    // Préparer le filtre pour la requête MongoDB
    const query = { ownerId: userId };
    if (filter !== 'all') {
      query.status = filter;
    }
    
    // Récupérer les demandes d'adoption pour cet utilisateur
    const requests = await db.collection('adoptionRequests')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    
    return NextResponse.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des demandes d\'adoption:', error);
    return NextResponse.json({
      success: false,
      message: `Une erreur est survenue: ${error.message}`
    }, { status: 500 });
  }
}