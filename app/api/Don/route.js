// api/don/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '../../config/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import cloudinary from '../../config/cloudinary';

/**
 * Obtient tous les dons
 */
export async function GET(req) {
  try {
    console.log('Début de la requête GET pour les dons');
    
    const db = await connectDB();
    
    // Récupérer tous les dons avec les informations du type et de l'utilisateur
    const dons = await db.collection('don')
      .aggregate([
        {
          $lookup: {
            from: 'type',
            localField: 'typeId',
            foreignField: '_id',
            as: 'typeInfo'
          }
        },
        {
          $lookup: {
            from: 'user',
            localField: 'userId',
            foreignField: '_id',
            as: 'userInfo'
          }
        },
        {
          $lookup: {
            from: 'veterinaire',
            localField: 'userId',
            foreignField: '_id',
            as: 'vetInfo'
          }
        },
        {
          $lookup: {
            from: 'association',
            localField: 'userId',
            foreignField: '_id',
            as: 'associationInfo'
          }
        },
        {
          $lookup: {
            from: 'animalrie',
            localField: 'userId',
            foreignField: '_id',
            as: 'storeInfo'
          }
        },
        {
          $unwind: '$typeInfo'
        },
        {
          $addFields: {
            userInfo: {
              $cond: {
                if: { $gt: [{ $size: '$userInfo' }, 0] },
                then: { $arrayElemAt: ['$userInfo', 0] },
                else: {
                  $cond: {
                    if: { $gt: [{ $size: '$vetInfo' }, 0] },
                    then: { $arrayElemAt: ['$vetInfo', 0] },
                    else: {
                      $cond: {
                        if: { $gt: [{ $size: '$associationInfo' }, 0] },
                        then: { $arrayElemAt: ['$associationInfo', 0] },
                        else: { $arrayElemAt: ['$storeInfo', 0] }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        {
          $project: {
            vetInfo: 0,
            associationInfo: 0,
            storeInfo: 0,
            'userInfo.password': 0
          }
        },
        {
          $sort: { createdAt: -1 }
        }
      ])
      .toArray();
    
    console.log(`Dons trouvés: ${dons.length}`);
    
    return NextResponse.json({
      success: true,
      data: dons,
      message: `${dons.length} dons récupérés avec succès`
    });
    
  } catch (error) {
    console.error(`Erreur lors de la récupération des dons: ${error.message}`);
    return NextResponse.json(
      { success: false, message: error.message || 'Erreur lors de la récupération des dons' },
      { status: 500 }
    );
  }
}

/**
 * Crée un nouveau don
 */
export async function POST(req) {
  try {
    // Vérifier l'authentification
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Authentification requise' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    
    // Extraction des données du formulaire
    const typeId = formData.get('typeId'); 
    const nom = formData.get('nom');
    const message = formData.get('message');
    
    // Validation des champs obligatoires
    if (!typeId || !nom || !message) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Les champs typeId et nom sont requis' 
        },
        { status: 400 }
      );
    }

    const db = await connectDB();
    
     
    // Récupérer le type depuis la base de données
    const typeDoc = await db.collection('type').findOne({ _id: new ObjectId(typeId) });
    if (!typeDoc) {
      return NextResponse.json(
        { success: false, message: 'Type de don non trouvé dans la base de données' },
        { status: 400 }
      );
    }
    
    // Upload des photos vers Cloudinary
    const photos = formData.getAll('photos');
    const photoUrls = [];
    
    if (photos && photos.length > 0) {
      for (const photo of photos) {
        if (photo.size > 0) {
          try {
            // Convertir le fichier en buffer
            const buffer = Buffer.from(await photo.arrayBuffer());
            
            // Upload vers Cloudinary
            const result = await new Promise((resolve, reject) => {
              cloudinary.uploader.upload_stream(
                {
                  resource_type: 'image',
                  folder: 'dons',
                  transformation: [
                    { width: 800, height: 600, crop: 'limit' },
                    { quality: 'auto:good' }
                  ]
                },
                (error, result) => {
                  if (error) reject(error);
                  else resolve(result);
                }
              ).end(buffer);
            });
            
            photoUrls.push({
              url: result.secure_url,
              publicId: result.public_id
            });
          } catch (uploadError) {
            console.error('Erreur upload photo:', uploadError);
          }
        }
      }
    }
    
    // Préparer les données du don
    const donData = {
      //type: type,
      nom: nom.trim(),
      message: message?.trim() || '',
      typeId: new ObjectId(typeId),
      userId: new ObjectId(session.user.id),
      photos: photoUrls,
       
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insérer le don dans la base de données
    const result = await db.collection('don').insertOne(donData);
    
    // Récupérer le don complet avec les informations du type
    const insertedDon = await db.collection('don')
      .aggregate([
        { $match: { _id: result.insertedId } },
        {
          $lookup: {
            from: 'type',
            localField: 'typeId',
            foreignField: '_id',
            as: 'typeInfo'
          }
        },
        { $unwind: '$typeInfo' }
      ])
      .toArray();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Don créé avec succès', 
      donId: result.insertedId,
      don: insertedDon[0]
    });
    
  } catch (error) {
    console.error('Erreur lors de la création du don:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erreur lors de la création du don' },
      { status: 500 }
    );
  }
}

/**
 * Met à jour un don
 */
export async function PUT(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Authentification requise' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, ...updateData } = body;
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'L\'ID du don est requis' },
        { status: 400 }
      );
    }
    
    const db = await connectDB();
    
    // Vérifier que le don appartient à l'utilisateur connecté
    const existingDon = await db.collection('don').findOne({ _id: new ObjectId(id) });
    if (!existingDon) {
      return NextResponse.json(
        { success: false, message: 'Don non trouvé' },
        { status: 404 }
      );
    }
    
    if (existingDon.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé à modifier ce don' },
        { status: 403 }
      );
    }
    
    // Préparer les données de mise à jour
    const updateFields = {
      ...updateData,
      updatedAt: new Date()
    };
    
    // Convertir les IDs si nécessaire
    if (updateFields.typeId) {
      updateFields.typeId = new ObjectId(updateFields.typeId);
    }
    
    const result = await db.collection('don').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Don non trouvé' },
        { status: 404 }
      );
    }
    
    // Récupérer le don mis à jour
    const updatedDon = await db.collection('don')
      .aggregate([
        { $match: { _id: new ObjectId(id) } },
        {
          $lookup: {
            from: 'type',
            localField: 'typeId',
            foreignField: '_id',
            as: 'typeInfo'
          }
        },
        { $unwind: '$typeInfo' }
      ])
      .toArray();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Don mis à jour avec succès',
      don: updatedDon[0]
    });
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour du don:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erreur lors de la mise à jour du don' },
      { status: 500 }
    );
  }
}

/**
 * Supprime un don
 */
export async function DELETE(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Authentification requise' },
        { status: 401 }
      );
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'L\'ID du don est requis' },
        { status: 400 }
      );
    }
    
    const db = await connectDB();
    
    // Récupérer le don pour vérifier les permissions et les photos
    const don = await db.collection('don').findOne({ _id: new ObjectId(id) });
    if (!don) {
      return NextResponse.json(
        { success: false, message: 'Don non trouvé' },
        { status: 404 }
      );
    }
    
    if (don.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé à supprimer ce don' },
        { status: 403 }
      );
    }
    
    // Supprimer les photos de Cloudinary
    if (don.photos && don.photos.length > 0) {
      for (const photo of don.photos) {
        try {
          await cloudinary.uploader.destroy(photo.publicId);
        } catch (error) {
          console.error('Erreur lors de la suppression de la photo:', error);
        }
      }
    }
    
    // Supprimer le don
    const result = await db.collection('don').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Don non trouvé' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Don supprimé avec succès'
    });
    
  } catch (error) {
    console.error('Erreur lors de la suppression du don:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erreur lors de la suppression du don' },
      { status: 500 }
    );
  }
}