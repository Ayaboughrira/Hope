// app/api/animals/[id]/route.js
// la page detail d'animal get annonce 

import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import { MongoClient } from 'mongodb';


const uri = process.env.MONGODB_URI;

// Cache la connexion
let client;
let db;

export async function connectDB() {
  try {
    if (!uri) {
      throw new Error('MONGODB_URI n\'est pas défini dans les variables d\'environnement');
    }
    
    if (db) return db;
    
    client = new MongoClient(uri);
    await client.connect();
    console.log('Connecté à MongoDB avec succès');
    
    db = client.db('Hope');
    return db;
  } catch (error) {
    console.error('Erreur de connexion à MongoDB:', error);
    throw new Error(`Impossible de se connecter à la base de données: ${error.message}`);
  }
}


// Ferme la connexion quand l'application se termine
process.on('SIGTERM', async () => {
    if (client) await client.close();
    console.log('Connexion MongoDB fermée');
});



export async function GET(request, { params }) {
  try {
    // Récupérer l'ID depuis les paramètres et attendre sa résolution
    const id = params.id;

    // Vérifier que l'ID est valide
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({
        success: false,
        message: 'ID d\'animal invalide'
      }, { status: 400 });
    }

    // Se connecter à MongoDB
    const db = await connectDB();
    const animalsCollection = db.collection('animals');
    
    // Récupérer l'animal par son ID
    const animal = await animalsCollection.findOne({ _id: new ObjectId(id) });
    
    if (!animal) {
      return NextResponse.json({
        success: false,
        message: 'Animal non trouvé'
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: animal 
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'animal:', error);
    return NextResponse.json({
      success: false,
      message: `Erreur lors de la récupération de l'animal: ${error.message}`
    }, { status: 500 });
  }
}