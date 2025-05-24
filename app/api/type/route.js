import { NextResponse } from 'next/server';
import { connectDB } from '../../config/mongodb';
import { ObjectId } from 'mongodb';

/**
 * Obtient tous les types de produits
 */
export async function GET(req) {
  try {
    console.log('Début de la requête GET pour les types');
    
    // Connexion à MongoDB
    const db = await connectDB();
    console.log('Connexion à MongoDB réussie');
    
    // Récupérer tous les types triés par nom - CORRECTION: utiliser 'type' au lieu de 'types'
    const types = await db.collection('type')
      .find({})
      .sort({ nomType: 1 }) // Utiliser nomType selon vos exemples
      .toArray();
    
    console.log(`Types trouvés: ${types.length}`);
    
    return NextResponse.json({
      success: true,
      data: types,
      message: `${types.length} types récupérés avec succès`
    });
    
  } catch (error) {
    console.error(`Erreur lors de la récupération des types: ${error.message}`);
    return NextResponse.json(
      { success: false, message: error.message || 'Erreur lors de la récupération des types' },
      { status: 500 }
    );
  }
}

/**
 * Crée un nouveau type de produit
 */
export async function POST(req) {
  try {
    const { nomType, description } = await req.json();
    
    if (!nomType) {
      return NextResponse.json(
        { success: false, message: 'Le nom du type est requis' },
        { status: 400 }
      );
    }
    
    // Connexion à MongoDB
    const db = await connectDB();
    
    // Vérifier si le type existe déjà
    const existingType = await db.collection('type').findOne({ nomType: nomType });
    if (existingType) {
      return NextResponse.json(
        { success: false, message: 'Un type avec ce nom existe déjà' },
        { status: 409 }
      );
    }
    
    // Préparer les données du type
    const typeData = {
      nomType: nomType.trim(),
      description: description?.trim() || '',
      createdAt: new Date()
    };
    
    // Insérer le document dans la collection 'type'
    const result = await db.collection('type').insertOne(typeData);
    
    // Récupérer le type complet pour le renvoyer
    const insertedType = await db.collection('type').findOne({ _id: result.insertedId });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Type créé avec succès', 
      typeId: result.insertedId,
      type: insertedType
    });
    
  } catch (error) {
    console.error('Erreur lors de la création du type:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erreur lors de la création du type' },
      { status: 500 }
    );
  }
}

/**
 * Met à jour un type de produit
 */
export async function PUT(req) {
  try {
    const { id, nomType, description } = await req.json();
    
    if (!id || !nomType) {
      return NextResponse.json(
        { success: false, message: 'L\'ID et le nom du type sont requis' },
        { status: 400 }
      );
    }
    
    // Connexion à MongoDB
    const db = await connectDB();
    
    // Vérifier si un autre type avec le même nom existe déjà
    const existingType = await db.collection('type').findOne({ 
      nomType: nomType,
      _id: { $ne: new ObjectId(id) }
    });
    
    if (existingType) {
      return NextResponse.json(
        { success: false, message: 'Un autre type avec ce nom existe déjà' },
        { status: 409 }
      );
    }
    
    // Mettre à jour le type
    const result = await db.collection('type').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: {
          nomType: nomType.trim(),
          description: description?.trim() || '',
          updatedAt: new Date()
        }
      }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Type non trouvé' },
        { status: 404 }
      );
    }
    
    // Récupérer le type mis à jour
    const updatedType = await db.collection('type').findOne({ _id: new ObjectId(id) });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Type mis à jour avec succès',
      type: updatedType
    });
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour du type:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erreur lors de la mise à jour du type' },
      { status: 500 }
    );
  }
}

/**
 * Supprime un type de produit
 */
export async function DELETE(req) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'L\'ID du type est requis' },
        { status: 400 }
      );
    }
    
    // Connexion à MongoDB
    const db = await connectDB();
    
    // Vérifier si des produits utilisent ce type
    const productsUsingType = await db.collection('produits').countDocuments({ typeId: new ObjectId(id) });
    
    if (productsUsingType > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Impossible de supprimer ce type car ${productsUsingType} produit(s) l'utilisent encore` 
        },
        { status: 409 }
      );
    }
    
    // Supprimer le type
    const result = await db.collection('type').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Type non trouvé' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Type supprimé avec succès'
    });
    
  } catch (error) {
    console.error('Erreur lors de la suppression du type:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erreur lors de la suppression du type' },
      { status: 500 }
    );
  }
}