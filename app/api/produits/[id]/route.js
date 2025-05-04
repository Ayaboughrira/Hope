import { NextResponse } from 'next/server';
import { connectDB } from '../../../config/mongodb';
import { ObjectId } from 'mongodb';

// Fonction GET pour récupérer un produit par ID
export async function GET(req, { params }) {
  try {
    const { id } = params;
    
    // Vérifier si l'ID est valide
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: 'ID de produit invalide' },
        { status: 400 }
      );
    }
    
    // Connexion à MongoDB
    const db = await connectDB();
    
    // Récupérer le produit avec cet ID
    const product = await db.collection('produits').findOne({ _id: new ObjectId(id) });
    
    // Si aucun produit n'est trouvé
    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Produit non trouvé' },
        { status: 404 }
      );
    }
    
    // Si le produit a un animalerieId, récupérer les informations de l'animalerie
    if (product.animalerieId) {
      try {
        const animalerie = await db.collection('animaleries').findOne({ 
          _id: product.animalerieId instanceof ObjectId 
            ? product.animalerieId 
            : new ObjectId(product.animalerieId) 
        });
        
        if (animalerie) {
          product.animalerie = animalerie;
        }
      } catch (animalerieError) {
        console.warn(`Erreur lors de la récupération de l'animalerie: ${animalerieError.message}`);
        // Continuer sans les infos d'animalerie
      }
    }
    
    // Retourner le produit
    return NextResponse.json(product);
    
  } catch (error) {
    console.error(`Erreur lors de la récupération du produit: ${error.message}`);
    return NextResponse.json(
      { success: false, message: error.message || 'Erreur lors de la récupération du produit' },
      { status: 500 }
    );
  }
}