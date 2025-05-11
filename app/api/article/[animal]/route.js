/*app/api/article/[animals]/route.js */
import { NextResponse } from 'next/server';
import { connectDB } from '../../../config/mongodb';

export async function GET(request, context) {
  try {
    // Extraire le paramètre animal de l'URL
    const {animal} = context.params;
    
    // Obtenir le paramètre type de la requête
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    console.log("API appelée avec animal:", animal, "et type:", type);
    
    // Connexion à la base de données
    const db = await connectDB();
    
    // Logging pour déboguer
    console.log("Connexion à MongoDB réussie, recherche d'articles avec typeAnimal =", animal);
    
    // Construire le filtre avec le bon nom de champ
    const filter = { typeAnimal: animal };
    if (type && type !== 'all') filter.typeArticle = type;
    
    // Récupérer les articles filtrés
    const articles = await db.collection('article').find(filter).toArray();
    console.log("Articles trouvés:", articles.length);
    
    // Convertir les _id en string pour être compatible avec JSON
    const formattedArticles = articles.map(article => ({
      ...article,
      id: article._id.toString(),
      _id: article._id.toString()
    }));
    
    return NextResponse.json(formattedArticles);
  } catch (error) {
    console.error("Erreur API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}