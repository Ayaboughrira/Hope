// app/api/species/route.js
import { NextResponse } from 'next/server';
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

// GET - Récupérer toutes les espèces
export async function GET() {
  try {
    const db = await connectDB();
    const speciesCollection = db.collection('species');
    
    // Récupérer toutes les espèces
    const species = await speciesCollection.find().toArray();
    
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