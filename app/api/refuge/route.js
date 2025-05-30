// api/refuge/route.js
import { NextResponse } from 'next/server';
import { connectDB } from '../../config/mongodb';
import { ObjectId } from 'mongodb';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import cloudinary from '../../config/cloudinary';

/**
 * Obtient tous les refuges
 */
export async function GET(req) {
  try {
    console.log('Début de la requête GET pour les refuges');
    
    const db = await connectDB();
    
    // Récupérer tous les refuges avec les informations de l'utilisateur
    const refuges = await db.collection('refuge')
      .aggregate([
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
    
    console.log(`Refuges trouvés: ${refuges.length}`);
    
    return NextResponse.json({
      success: true,
      data: refuges,
      message: `${refuges.length} refuges récupérés avec succès`
    });
    
  } catch (error) {
    console.error(`Erreur lors de la récupération des refuges: ${error.message}`);
    return NextResponse.json(
      { success: false, message: error.message || 'Erreur lors de la récupération des refuges' },
      { status: 500 }
    );
  }
}

/**
 * Crée un nouveau refuge
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
    const nom = formData.get('nom');
    const wilaya = formData.get('adresse.wilaya');
    const commune = formData.get('adresse.commune');
    const cite = formData.get('adresse.cite');
    const telephone = formData.get('contact.telephone');
    const email = formData.get('contact.email');
    const capacite = formData.get('capacite');
    const description = formData.get('description');
    
    // Récupérer les types d'animaux (array)
    const typeAnimaux = formData.getAll('typeAnimaux');
    
    // Validation des champs obligatoires
    if (!nom || !wilaya || !commune || !cite || !telephone || !email || !capacite || !description  || !typeAnimaux || typeAnimaux.length === 0)  {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Tous les champs obligatoires doivent être remplis' 
        },
        { status: 400 }
      );
    }

    const db = await connectDB();
    
    // Vérifier si un refuge avec le même nom existe déjà dans la même wilaya
    const existingRefuge = await db.collection('refuge').findOne({ 
      nom: nom.trim(),
      'adresse.wilaya': wilaya.trim()
    });
    
    if (existingRefuge) {
      return NextResponse.json(
        { success: false, message: 'Un refuge avec ce nom existe déjà dans cette wilaya' },
        { status: 409 }
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
                  folder: 'refuges',
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
    
    // Préparer les données du refuge
    const refugeData = {
      nom: nom.trim(),
      adresse: {
        wilaya: wilaya.trim(),
        commune: commune.trim(),
        cite: cite.trim()
      },
      contact: {
        telephone: telephone.trim(),
        email: email.trim()
      },
      capacite: parseInt(capacite),
      typeAnimaux: typeAnimaux,
      description: description.trim(),
      userId: new ObjectId(session.user.id),
      photos: photoUrls,
       
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Insérer le refuge dans la base de données
    const result = await db.collection('refuge').insertOne(refugeData);
    
    // Récupérer le refuge complet
    const insertedRefuge = await db.collection('refuge').findOne({ _id: result.insertedId });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Refuge créé avec succès', 
      refugeId: result.insertedId,
      refuge: insertedRefuge
    });
    
  } catch (error) {
    console.error('Erreur lors de la création du refuge:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erreur lors de la création du refuge' },
      { status: 500 }
    );
  }
}

/**
 * Met à jour un refuge
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
        { success: false, message: 'L\'ID du refuge est requis' },
        { status: 400 }
      );
    }
    
    const db = await connectDB();
    
    // Vérifier que le refuge appartient à l'utilisateur connecté
    const existingRefuge = await db.collection('refuge').findOne({ _id: new ObjectId(id) });
    if (!existingRefuge) {
      return NextResponse.json(
        { success: false, message: 'Refuge non trouvé' },
        { status: 404 }
      );
    }
    
    if (existingRefuge.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé à modifier ce refuge' },
        { status: 403 }
      );
    }
    
    // Préparer les données de mise à jour
    const updateFields = {
      ...updateData,
      updatedAt: new Date()
    };
    
    const result = await db.collection('refuge').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Refuge non trouvé' },
        { status: 404 }
      );
    }
    
    // Récupérer le refuge mis à jour
    const updatedRefuge = await db.collection('refuge').findOne({ _id: new ObjectId(id) });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Refuge mis à jour avec succès',
      refuge: updatedRefuge
    });
    
  } catch (error) {
    console.error('Erreur lors de la mise à jour du refuge:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erreur lors de la mise à jour du refuge' },
      { status: 500 }
    );
  }
}

/**
 * Supprime un refuge
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
        { success: false, message: 'L\'ID du refuge est requis' },
        { status: 400 }
      );
    }
    
    const db = await connectDB();
    
    // Récupérer le refuge pour vérifier les permissions et les photos
    const refuge = await db.collection('refuge').findOne({ _id: new ObjectId(id) });
    if (!refuge) {
      return NextResponse.json(
        { success: false, message: 'Refuge non trouvé' },
        { status: 404 }
      );
    }
    
    if (refuge.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { success: false, message: 'Non autorisé à supprimer ce refuge' },
        { status: 403 }
      );
    }
    
    // Supprimer les photos de Cloudinary
    if (refuge.photos && refuge.photos.length > 0) {
      for (const photo of refuge.photos) {
        try {
          await cloudinary.uploader.destroy(photo.publicId);
        } catch (error) {
          console.error('Erreur lors de la suppression de la photo:', error);
        }
      }
    }
    
    // Supprimer le refuge
    const result = await db.collection('refuge').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: 'Refuge non trouvé' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Refuge supprimé avec succès'
    });
    
  } catch (error) {
    console.error('Erreur lors de la suppression du refuge:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erreur lors de la suppression du refuge' },
      { status: 500 }
    );
  }
}