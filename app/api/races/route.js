// app/api/races/route.js
import { ObjectId } from 'mongodb';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectDB } from '../../config/mongodb';

// GET - Récupérer toutes les races ou les races d'une espèce spécifique
export async function GET(request) {
  try {
    const db = await connectDB();
    const racesCollection = db.collection('races');
    
    // Vérifier si un filtre d'espèce est appliqué
    const { searchParams } = new URL(request.url);
    const speciesId = searchParams.get('speciesId');
    const speciesCode = searchParams.get('speciesCode');
    
    let query = {};
    
    // Filtrer par speciesId (ObjectId) ou speciesCode
    if (speciesId && ObjectId.isValid(speciesId)) {
      query.speciesId = new ObjectId(speciesId);
    } else if (speciesCode) {
      query.speciesCode = speciesCode;
    }
    
    const races = await racesCollection.find(query).toArray();
    
    return NextResponse.json({ 
      success: true, 
      data: races 
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des races:', error);
    return NextResponse.json({
      success: false,
      message: `Erreur lors de la récupération des races: ${error.message}`
    }, { status: 500 });
  }
}

// POST - Créer une nouvelle race
export async function POST(request) {
  try {
    // Vérifier l'authentification - seuls les admins devraient pouvoir ajouter des races
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'admin') {
      return NextResponse.json({
        success: false,
        message: 'Authentification requise ou permissions insuffisantes'
      }, { status: 401 });
    }
    
    const db = await connectDB();
    const data = await request.json();
    
    // Vérifier que le code de race est fourni
    if (!data.code) {
      return NextResponse.json({
        success: false,
        message: 'Le code de la race est obligatoire'
      }, { status: 400 });
    }
    
    // Vérifier que l'espèce existe
    const speciesCollection = db.collection('species');
    let speciesDoc;
    
    if (ObjectId.isValid(data.speciesId)) {
      speciesDoc = await speciesCollection.findOne({ _id: new ObjectId(data.speciesId) });
    } else if (data.speciesCode) {
      speciesDoc = await speciesCollection.findOne({ code: data.speciesCode });
    }
    
    if (!speciesDoc) {
      return NextResponse.json({
        success: false,
        message: 'L\'espèce spécifiée n\'existe pas'
      }, { status: 400 });
    }
    
    // Créer l'objet race
    const raceObject = {
      code: data.code,
      name: data.name || getRaceName(data.code),
      speciesCode: speciesDoc.code,
      speciesId: speciesDoc._id,
      description: data.description || '',
      createdAt: new Date()
    };
    
    // Vérifier si la race existe déjà
    const racesCollection = db.collection('races');
    const existingRace = await racesCollection.findOne({ 
      code: raceObject.code,
      speciesCode: raceObject.speciesCode
    });
    
    if (existingRace) {
      return NextResponse.json({
        success: false,
        message: 'Cette race existe déjà pour cette espèce'
      }, { status: 400 });
    }
    
    // Insérer dans MongoDB
    const result = await racesCollection.insertOne(raceObject);
    
    return NextResponse.json({
      success: true,
      message: 'Race créée avec succès',
      raceId: result.insertedId
    }, { status: 201 });
  } catch (error) {
    console.error('Erreur lors de la création de la race:', error);
    return NextResponse.json({
      success: false,
      message: `Erreur: ${error.message}`
    }, { status: 500 });
  }
}

// Fonction auxiliaire pour obtenir le nom de la race à partir de son code
function getRaceName(raceCode) {
  const raceMap = {
    // Races de chiens
    'dog_labrador': 'Labrador Retriever',
    'dog_germanshepherd': 'Berger Allemand',
    'dog_goldenretriever': 'Golden Retriever',
    'dog_bulldog': 'Bulldog',
    'dog_beagle': 'Beagle',
    'dog_poodle': 'Caniche',
    
    // Races de chats
    'cat_persian': 'Persan',
    'cat_siamese': 'Siamois',
    'cat_mainecoon': 'Maine Coon',
    'cat_ragdoll': 'Ragdoll',
    'cat_bengal': 'Bengal',
    'cat_sphynx': 'Sphynx',
    
    // Races d'oiseaux
    'bird_canary': 'Canari',
    'bird_parakeet': 'Perruche',
    'bird_cockatiel': 'Cockatiel',
    'bird_lovebird': 'Inséparable',
    'bird_finch': 'Pinson',
    'bird_parrot': 'Perroquet'
  };
  return raceMap[raceCode] || raceCode;
}