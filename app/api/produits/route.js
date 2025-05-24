import { NextResponse } from 'next/server';
import { connectDB } from '../../config/mongodb';
import cloudinary from '../../config/cloudinary';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { ObjectId } from 'mongodb';

// Constants de pagination par défaut
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;

/**
 * Obtient tous les produits avec pagination et filtres optionnels
 */
export async function GET(req) {
  try {
    console.log('Début de la requête GET pour les produits');
    
    // Récupérer les paramètres de requête
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || DEFAULT_PAGE);
    const limit = parseInt(url.searchParams.get('limit') || DEFAULT_LIMIT);
    const minPrice = parseFloat(url.searchParams.get('minPrice') || 0);
    const maxPrice = parseFloat(url.searchParams.get('maxPrice') || Number.MAX_SAFE_INTEGER);
    const searchTerm = url.searchParams.get('search') || '';
    const typeId = url.searchParams.get('typeId') || ''; // Filtrer par type
    const animalrieId = url.searchParams.get('animalrieId') || ''; // Corriger le nom du paramètre
    
    console.log(`Paramètres de requête: page=${page}, limit=${limit}, minPrice=${minPrice}, maxPrice=${maxPrice}, search=${searchTerm}, typeId=${typeId}, animalrieId=${animalrieId}`);
    
    // Valider les paramètres
    if (isNaN(page) || page < 1) {
      return NextResponse.json({ success: false, message: 'Le numéro de page doit être un entier positif' }, { status: 400 });
    }
    
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json({ success: false, message: 'La limite doit être un entier entre 1 et 100' }, { status: 400 });
    }
    
    // Calculer le décalage pour la pagination
    const skip = (page - 1) * limit;
    
    // Connexion à MongoDB
    const db = await connectDB();
    console.log('Connexion à MongoDB réussie');
    
    // Construire la requête de filtrage
    let query = {};
    
    // Ajouter la condition de prix
    query.$or = [
      { price: { $gte: minPrice, $lte: maxPrice } },
      { prix: { $gte: minPrice, $lte: maxPrice } }
    ];
    
    // Ajouter le filtre par type si spécifié
    if (typeId) {
      query.typeId = typeId;
    }
    
    // Corriger le nom du champ pour l'animalrie
    if (animalrieId) {
      query.animalrieId = animalrieId;
    }
    
    // Ajouter la recherche textuelle si un terme est fourni
    if (searchTerm && searchTerm.trim() !== '') {
      const searchRegex = { $regex: searchTerm, $options: 'i' };
      query = {
        $and: [
          { $or: query.$or }, // Conserver les conditions de prix
          ...(typeId ? [{ typeId: typeId }] : []), // Conserver le filtre type
          ...(animalrieId ? [{ animalrieId: animalrieId }] : []), // Corriger le nom du champ
          { $or: [
              { label: searchRegex },
              { libelle: searchRegex },
              { description: searchRegex },
              { descriptionProduit: searchRegex }
            ]
          }
        ]
      };
    } else if (typeId || animalrieId) {
      // Si pas de recherche textuelle mais des filtres type/animalrie
      const conditions = [{ $or: query.$or }];
      if (typeId) conditions.push({ typeId: typeId });
      if (animalrieId) conditions.push({ animalrieId: animalrieId }); // Corriger le nom du champ
      
      query = { $and: conditions };
    }
    
    console.log('Requête MongoDB:', JSON.stringify(query, null, 2));
    
    // Exécuter la requête avec pagination et jointure avec les types et animalries
    const produits = await db.collection('produits')
      .aggregate([
        { $match: query },
        // Jointure avec la collection types
        {
          $lookup: {
            from: 'type',
            localField: 'typeId',
            foreignField: '_id',
            as: 'type'
          }
        },
        // Jointure avec la collection animalrie (corriger le nom)
        {
          $lookup: {
            from: 'animalrie',
            localField: 'animalrieId', // Corriger le nom du champ local
            foreignField: '_id',
            as: 'animalrie'
          }
        },
        // Dérouler les tableaux pour avoir un objet simple
        {
          $addFields: {
            type: { $arrayElemAt: ['$type', 0] },
            animalrie: { $arrayElemAt: ['$animalrie', 0] } // Corriger le nom
          }
        },
        // Trier par date de création (plus récent d'abord)
        { $sort: { createdAt: -1 } },
        // Pagination
        { $skip: skip },
        { $limit: limit }
      ])
      .toArray();
    
    console.log(`Produits trouvés: ${produits.length}`);
    
    // Obtenir le nombre total de produits correspondant aux critères
    const totalCount = await db.collection('produits').countDocuments(query);
    
    // Calculer le nombre total de pages
    const totalPages = Math.ceil(totalCount / limit);
    
    console.log(`Requête exécutée avec succès. ${produits.length} produits trouvés sur ${totalCount} au total.`);
    
    // Normaliser les produits pour qu'ils soient compatibles avec le frontend
    const normalizedProducts = produits.map(product => {
      const normalizedProduct = {
        ...product,
        _id: product._id,
        label: product.label || product.libelle || '',
        price: parseFloat(product.price !== undefined ? product.price : (product.prix || 0)),
        prix: parseFloat(product.prix !== undefined ? product.prix : (product.price || 0)),
        description: product.description || product.descriptionProduit || '',
        descriptionProduit: product.descriptionProduit || product.description || '',
        image: product.image || product.photosProduit || '',
        photosProduit: product.photosProduit || product.image || '',
        promotion: parseFloat(product.promotion || 0),
        typeId: product.typeId || null,
        animalrieId: product.animalrieId || null, // Corriger le nom
        // Informations sur le type
        typeName: product.type?.nom || 'Non spécifié',
        typeDescription: product.type?.description || '',
        // Informations sur l'animalrie (corriger le nom)
        animalrieName: product.animalrie?.nom || product.animalrie?.name || 'Non spécifié',
        animalrieEmail: product.animalrie?.email || '',
        animalrieAdresse: product.animalrie?.adresse || ''
      };
      
      return normalizedProduct;
    });
    
    return NextResponse.json({
      success: true,
      data: normalizedProducts,
      pagination: {
        page: page,
        totalPages: totalPages,
        totalItems: totalCount,
        limit: limit
      }
    });
    
  } catch (error) {
    console.error(`Erreur lors de la récupération des produits: ${error.message}`);
    console.error(error.stack);
    return NextResponse.json(
      { success: false, message: error.message || 'Erreur lors de la récupération des produits' },
      { status: 500 }
    );
  }
}

/**
 * Crée un nouveau produit
 */
export async function POST(req) {
  try {
    console.log('Début de la création d\'un nouveau produit');
    
    // Utiliser l'API formData() native
    const formData = await req.formData();
    
    // Extraire les données du formulaire
    const label = formData.get('label'); 
    const price = formData.get('price');
    const promotion = formData.get('promotion');
    const description = formData.get('description');
    const typeId = formData.get('typeId'); // Récupérer typeId
    const imageFile = formData.get('image');
    const animalrieId = formData.get('animalrieId'); // Corriger le nom du paramètre
    
    console.log('Données reçues:', {
      label,
      price,
      promotion,
      description,
      typeId,
      animalrieId, // Affichage avec le nom corrigé
      hasImage: !!imageFile
    });
    
    // Validation des données requises (SUPPRESSION de la vérification animalrieId obligatoire)
    if (!label || !price || !description || !typeId) {
      return NextResponse.json(
        { success: false, message: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      );
    }
    
    // Connexion à MongoDB
    const db = await connectDB();
    console.log('Connexion à MongoDB réussie');
    
    // Vérifier que le type existe
    const typeExists = await db.collection('type').findOne({ _id: new ObjectId(typeId) });
    if (!typeExists) {
      return NextResponse.json(
        { success: false, message: 'Le type de produit spécifié n\'existe pas' },
        { status: 400 }
      );
    }
    console.log('Type vérifié:', typeExists);
    
    // Vérifier que l'animalrie existe SEULEMENT si un ID est fourni
    if (animalrieId) {
      const animalrieExists = await db.collection('animalrie').findOne({ _id: new ObjectId(animalrieId) });
      if (!animalrieExists) {
        return NextResponse.json(
          { success: false, message: 'L\'animalrie spécifiée n\'existe pas' },
          { status: 400 }
        );
      }
      console.log('Animalrie vérifiée:', animalrieExists);
    } else {
      console.log('Aucun animalrieId fourni - produit sera créé sans association');
    }
    
    // Uploader l'image à Cloudinary si présente
    let imageUrl = null;
    if (imageFile && typeof imageFile.arrayBuffer === 'function' && imageFile.size > 0) {
      console.log('Upload de l\'image en cours...');
      
      // Créer un dossier temporaire s'il n'existe pas
      const tmpDir = path.join(process.cwd(), 'tmp');
      await mkdir(tmpDir, { recursive: true });
      
      // Générer un nom de fichier temporaire
      const tempFilePath = path.join(tmpDir, `upload_${Date.now()}_${imageFile.name || 'image'}`);
      
      // Enregistrer le fichier temporairement
      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      await writeFile(tempFilePath, buffer);
      
      // Uploader à Cloudinary
      const result = await cloudinary.uploader.upload(tempFilePath, {
        folder: 'produits',
      });
      
      imageUrl = result.secure_url;
      console.log('Image uploadée:', imageUrl);
      
      // Supprimer le fichier temporaire
      await unlink(tempFilePath);
    }
    
    // Préparer les données du produit
    const parsedPrice = parseFloat(price);
    const parsedPromotion = promotion ? parseFloat(promotion) : 0;
    
    const productData = {
      label: label,
      price: parsedPrice,
      promotion: parsedPromotion,
      description: description,
      typeId: new ObjectId(typeId), // Référence vers la collection types
      animalrieId: animalrieId ? new ObjectId(animalrieId) : null, // Corriger le nom du champ
      image: imageUrl,
      photosProduit: imageUrl, // Pour la compatibilité
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('Données du produit à insérer:', productData);
    
    // Insérer le document dans la collection 'produits'
    const result = await db.collection('produits').insertOne(productData);
    console.log('Produit inséré avec l\'ID:', result.insertedId);
    
    // Récupérer le produit complet avec les informations du type et de l'animalrie
    const insertedProduct = await db.collection('produits')
      .aggregate([
        { $match: { _id: result.insertedId } },
        {
          $lookup: {
            from: 'type',
            localField: 'typeId',
            foreignField: '_id',
            as: 'type'
          }
        },
        {
          $lookup: {
            from: 'animalrie', // Nom de collection correct
            localField: 'animalrieId', // Nom de champ correct
            foreignField: '_id',
            as: 'animalrie'
          }
        },
        {
          $addFields: {
            type: { $arrayElemAt: ['$type', 0] },
            animalrie: { $arrayElemAt: ['$animalrie', 0] } // Nom correct
          }
        }
      ])
      .toArray();
    
    console.log('Produit créé avec succès:', insertedProduct[0]);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Produit créé avec succès', 
      productId: result.insertedId,
      product: insertedProduct[0]
    });
    
  } catch (error) {
    console.error('Erreur lors de la création du produit:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erreur lors de la création du produit' },
      { status: 500 }
    );
  }
}