// app/api/species/route.js
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectDB } from '../../config/mongodb';

// GET - Récupérer toutes les espèces
export async function GET() {
  try {
    const db = await connectDB();
    const speciesCollection = db.collection('species');
    
    const species = await speciesCollection.find({}).toArray();
    
    return NextResponse.json({ 
      success: true, 
      data: species 
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des espèces:', error);
    return NextResponse.json({
      success: false,
      message: `Erreur lors de la récupération des espèces: ${error.message}`
    }, { status: 500 });
  }
}

// POST - Créer une nouvelle espèce
export async function POST(request) {
  try {
    // Vérifier l'authentification - seuls les admins devraient pouvoir ajouter des espèces
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: 'Authentification requise ou permissions insuffisantes'
      }, { status: 401 });
    }
    
    const db = await connectDB();
    const data = await request.json();
    
    // Vérifier que le code d'espèce est fourni
    if (!data.code) {
      return NextResponse.json({
        success: false,
        message: 'Le code de l\'espèce est obligatoire'
      }, { status: 400 });
    }
    
    // Vérifier si l'espèce existe déjà
    const speciesCollection = db.collection('species');
    const existingSpecies = await speciesCollection.findOne({ code: data.code });
    
    if (existingSpecies) {
      return NextResponse.json({
        success: false,
        message: 'Cette espèce existe déjà'
      }, { status: 400 });
    }
    
    // Créer l'objet espèce
    const speciesObject = {
      code: data.code,
      name: data.name || getSpeciesName(data.code),
      description: data.description || '',
      createdAt: new Date()
    };
    
    // Insérer dans MongoDB
    const result = await speciesCollection.insertOne(speciesObject);
    
    return NextResponse.json({
      success: true,
      message: 'Espèce créée avec succès',
      speciesId: result.insertedId
    }, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de l\'espèce:', error);
    return NextResponse.json({
      success: false,
      message: `Erreur: ${error.message}`
    }, { status: 500 });
  }
}

// Fonction auxiliaire pour obtenir le nom de l'espèce à partir de son code
function getSpeciesName(speciesCode) {
  const speciesMap = {
    'dog': 'Chien',
    'cat': 'Chat',
    'bird': 'Oiseau'
  };
  return speciesMap[speciesCode] || speciesCode;
}