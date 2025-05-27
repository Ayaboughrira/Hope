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
    const minPrice = url.searchParams.get('minPrice') ? parseFloat(url.searchParams.get('minPrice')) : null;
    const maxPrice = url.searchParams.get('maxPrice') ? parseFloat(url.searchParams.get('maxPrice')) : null;
    const searchTerm = url.searchParams.get('search') || '';
    const typeId = url.searchParams.get('typeId') || '';
    const animalrieId = url.searchParams.get('animalrieId') || '';
    
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
    let conditions = [];
    
    // Ajouter la condition de prix SEULEMENT si des valeurs sont spécifiées
    if (minPrice !== null || maxPrice !== null) {
      let priceCondition = {};
      
      if (minPrice !== null) {
        priceCondition.$gte = minPrice;
      }
      if (maxPrice !== null) {
        priceCondition.$lte = maxPrice;
      }
      
      // Chercher dans les deux champs possibles pour le prix
      conditions.push({
        $or: [
          { price: priceCondition },
          { prix: priceCondition }
        ]
      });
    }
    
    // Ajouter le filtre par type si spécifié
    if (typeId) {
      try {
        conditions.push({ typeId: new ObjectId(typeId) });
      } catch (error) {
        console.error('ObjectId invalide pour typeId:', typeId);
        return NextResponse.json({ success: false, message: 'ID de type invalide' }, { status: 400 });
      }
    }
    
    // Ajouter le filtre par animalerie si spécifié
    if (animalrieId) {
      try {
        conditions.push({ animalrieId: new ObjectId(animalrieId) });
      } catch (error) {
        console.error('ObjectId invalide pour animalrieId:', animalrieId);
        return NextResponse.json({ success: false, message: 'ID d\'animalerie invalide' }, { status: 400 });
      }
    }
    
    // Ajouter la recherche textuelle si un terme est fourni
    if (searchTerm && searchTerm.trim() !== '') {
      const searchRegex = { $regex: searchTerm.trim(), $options: 'i' };
      conditions.push({
        $or: [
          { label: searchRegex },
          { libelle: searchRegex },
          { description: searchRegex },
          { descriptionProduit: searchRegex }
        ]
      });
    }
    
    // Construire la requête finale
    if (conditions.length > 0) {
      query = { $and: conditions };
    }
    
    console.log('Requête MongoDB:', JSON.stringify(query, null, 2));
    
    // Exécuter la requête avec pagination et jointure avec les types et animaleries
    const produits = await db.collection('produits')
      .aggregate([
        ...(Object.keys(query).length > 0 ? [{ $match: query }] : []), // Appliquer le filtre seulement s'il existe
        // Jointure avec la collection types
        {
          $lookup: {
            from: 'type',
            localField: 'typeId',
            foreignField: '_id',
            as: 'type'
          }
        },
        // Jointure avec la collection animalrie
        {
          $lookup: {
            from: 'animalrie',
            localField: 'animalrieId',
            foreignField: '_id',
            as: 'animalrie'
          }
        },
        // Dérouler les tableaux pour avoir un objet simple
        {
          $addFields: {
            type: { $arrayElemAt: ['$type', 0] },
            animalrie: { $arrayElemAt: ['$animalrie', 0] }
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
    
    // Debug: afficher un exemple de produit avec ses données d'animalerie
    if (produits.length > 0) {
      console.log('Exemple de produit avec animalerie:', JSON.stringify(produits[0], null, 2));
    }
    
    // Obtenir le nombre total de produits correspondant aux critères
    const totalCount = Object.keys(query).length > 0 
      ? await db.collection('produits').countDocuments(query)
      : await db.collection('produits').countDocuments({});
    
    console.log(`Total de produits dans la base: ${totalCount}`);
    
    // Calculer le nombre total de pages
    const totalPages = Math.ceil(totalCount / limit);
    
    console.log(`Requête exécutée avec succès. ${produits.length} produits trouvés sur ${totalCount} au total.`);
    
    // Normaliser les produits pour qu'ils soient compatibles avec le frontend
    const normalizedProducts = produits.map(product => {
      // Debug pour chaque produit
      console.log(`Normalisation du produit ${product._id}:`, {
        animalrie: product.animalrie,
        animalrieId: product.animalrieId
      });
      
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
        animalrieId: product.animalrieId || null,
        // Informations sur le type
        typeName: product.type?.nom || product.type?.nomType || 'Non spécifié',
        typeDescription: product.type?.description || '',
        // CORRECTION PRINCIPALE: Vérifier tous les champs possibles pour le nom de l'animalerie
        animalrieName: product.animalrie?.storeName ||
                       'Animalerie non spécifiée',

        animalrieEmail: product.animalrie?.email || '',

        animalrieAdresse: product.animalrie?.adresse || 
                          product.animalrie?.address || 
                          product.animalrie?.localisation || '',

        animalrieTelephone: product.animalrie?.telephone || 
                            product.animalrie?.phone || '',
                            
        animalrieDescription: product.animalrie?.description || ''
      };
      
      // Debug final
      console.log(`Produit ${product._id} normalisé - Nom animalerie: ${normalizedProduct.animalrieName}`);
      
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
    const typeId = formData.get('typeId');
    const imageFile = formData.get('image');
    const animalrieId = formData.get('animalrieId');
    
    console.log('Données reçues:', {
      label,
      price,
      promotion,
      description,
      typeId,
      animalrieId,
      hasImage: !!imageFile
    });
    
    // Validation des données requises
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
      typeId: new ObjectId(typeId),
      animalrieId: animalrieId ? new ObjectId(animalrieId) : null,
      image: imageUrl,
      photosProduit: imageUrl,
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
            from: 'animalrie',
            localField: 'animalrieId',
            foreignField: '_id',
            as: 'animalrie'
          }
        },
        {
          $addFields: {
            type: { $arrayElemAt: ['$type', 0] },
            animalrie: { $arrayElemAt: ['$animalrie', 0] }
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