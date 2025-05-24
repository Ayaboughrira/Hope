// app/api/races/route.js
import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

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

// GET - Récupérer toutes les races ou filtrées par espèce
export async function GET(request) {
  try {
    const db = await connectDB();
    const racesCollection = db.collection('races');

    // Récupérer les paramètres de l'URL
    const { searchParams } = new URL(request.url);
    const speciesId = searchParams.get('speciesId');
    
    // Si speciesId est fourni, filtrer par espèce
    if (speciesId) {
      console.log(`Recherche de races pour speciesId: ${speciesId}`);
      
      // IMPORTANT: Dans la collection races, speciesId est stocké comme une CHAÎNE
      // et non comme un ObjectId, donc nous devons chercher directement par la chaîne
      const query = { speciesId: speciesId };
      
      console.log('Requête de recherche:', JSON.stringify(query));
      
      // Récupérer les races pour l'espèce spécifiée
      const races = await racesCollection.find(query).toArray();
      
      // Ajout de logging pour débugger
      console.log(`Races trouvées pour speciesId ${speciesId}:`, races.length);
      
      // Si aucune race n'est trouvée, essayer avec la recherche élargie
      if (races.length === 0) {
        console.log('Aucune race trouvée avec la recherche directe. Essai de recherche élargie...');
        
        // Élargir la recherche
        const expandedQuery = {
          $or: [
            { speciesId: speciesId },
            { speciesId: ObjectId.isValid(speciesId) ? new ObjectId(speciesId).toString() : speciesId }
          ]
        };
        
        console.log('Requête élargie:', JSON.stringify(expandedQuery));
        const expandedRaces = await racesCollection.find(expandedQuery).toArray();
        console.log(`Races trouvées avec recherche élargie: ${expandedRaces.length}`);
        
        if (expandedRaces.length > 0) {
          return NextResponse.json({
            success: true,
            data: expandedRaces
          });
        }
        
        // Si toujours rien, chercher toutes les races pour voir ce qui existe
        const allRaces = await racesCollection.find({}).limit(5).toArray();
        console.log('Échantillon de toutes les races disponibles:', allRaces);
        
        // Récupérer les données de l'espèce pour créer des races par défaut
        const speciesCollection = db.collection('species');
        const speciesData = await speciesCollection.findOne({ 
          _id: ObjectId.isValid(speciesId) ? new ObjectId(speciesId) : null 
        });
        
        if (speciesData) {
          // Créer des races par défaut pour cette espèce
          const defaultRaces = [
            {
              name: `Race 1 pour ${speciesData.code}`,
              code: `${speciesData.code}-race1`,
              speciesId: speciesId, // Stocké comme chaîne, comme dans les exemples fournis
              speciesCode: speciesData.code
            },
            {
              name: `Race 2 pour ${speciesData.code}`,
              code: `${speciesData.code}-race2`,
              speciesId: speciesId, // Stocké comme chaîne, comme dans les exemples fournis
              speciesCode: speciesData.code
            }
          ];
          
          console.log('Retour des races par défaut pour cette espèce');
          return NextResponse.json({
            success: true,
            data: defaultRaces,
            message: 'Races par défaut générées pour cette espèce'
          });
        }
      }
      
      // Transformer les données pour s'assurer que chaque race a un nom
      const processedRaces = races.map(race => {
        // S'assurer que chaque race a un champ 'name'
        // Note: D'après les exemples, le champ 'name' existe déjà
        // Mais nous gardons cette vérification par sécurité
        if (!race.name && race.code) {
          race.name = race.code.split('-')[1] || race.code;
        }
        return race;
      });
      
      return NextResponse.json({
        success: true,
        data: processedRaces
      });
    } else {
      // Si aucun speciesId n'est fourni, renvoyer toutes les races
      console.log('Aucun speciesId fourni, récupération de toutes les races');
      const allRaces = await racesCollection.find({}).toArray();
      console.log(`Nombre total de races trouvées: ${allRaces.length}`);
      
      // Transformer les données pour s'assurer que chaque race a un nom
      const processedRaces = allRaces.map(race => {
        if (!race.name && race.code) {
          race.name = race.code.split('-')[1] || race.code;
        }
        return race;
      });
      
      return NextResponse.json({
        success: true,
        data: processedRaces
      });
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des races:', error);
    return NextResponse.json({
      success: false,
      message: `Erreur lors de la récupération des races: ${error.message}`
    }, { status: 500 });
  }
}