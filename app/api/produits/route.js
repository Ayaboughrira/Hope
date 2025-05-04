import { NextResponse } from 'next/server';
import { connectDB } from '../../config/mongodb';
import cloudinary from '../../config/cloudinary';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';


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
    const category = url.searchParams.get('category') || '';
    
    console.log(`Paramètres de requête: page=${page}, limit=${limit}, minPrice=${minPrice}, maxPrice=${maxPrice}, search=${searchTerm}, category=${category}`);
    
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
    
    // Construire la requête de filtrage avec une approche plus robuste
    // Gérer à la fois les champs price et prix
    let query = {};
    
    // Ajouter la condition de prix
    query.$or = [
      { price: { $gte: minPrice, $lte: maxPrice } },
      { prix: { $gte: minPrice, $lte: maxPrice } }
    ];
    
    // Ajouter le filtre par catégorie si spécifié
    if (category) {
      query.category = category;
    }
    
    // Ajouter la recherche textuelle si un terme est fourni
    if (searchTerm && searchTerm.trim() !== '') {
      // Remplacer la condition $or existante par une nouvelle qui combine prix et recherche
      const searchRegex = { $regex: searchTerm, $options: 'i' };
      query = {
        $and: [
          { $or: query.$or }, // Conserver les conditions de prix
          { $or: [
              { label: searchRegex },
              { libelle: searchRegex },
              { description: searchRegex },
              { descriptionProduit: searchRegex }
            ]
          }
        ]
      };
    }
    
    console.log('Requête MongoDB:', JSON.stringify(query, null, 2));
    
    // Exécuter la requête avec pagination
    const produits = await db.collection('produits')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    
    console.log(`Produits trouvés: ${produits.length}`);
    
    // Obtenir le nombre total de produits correspondant aux critères
    const totalCount = await db.collection('produits').countDocuments(query);
    
    // Calculer le nombre total de pages
    const totalPages = Math.ceil(totalCount / limit);
    
    console.log(`Requête exécutée avec succès. ${produits.length} produits trouvés sur ${totalCount} au total.`);
    
    // Normaliser les produits pour qu'ils soient compatibles avec le frontend
    const normalizedProducts = produits.map(product => {
      // S'assurer que tous les champs nécessaires sont présents et normalisés
      const normalizedProduct = {
        ...product,
        _id: product._id,
        label: product.label || product.libelle || '',
        // Normaliser le prix en choisissant d'abord price, puis prix
        price: parseFloat(product.price !== undefined ? product.price : (product.prix || 0)),
        // Conserver le champ prix si présent pour la rétrocompatibilité
        prix: parseFloat(product.prix !== undefined ? product.prix : (product.price || 0)),
        // Normaliser la description
        description: product.description || product.descriptionProduit || '',
        // Conserver descriptionProduit si présent pour la rétrocompatibilité
        descriptionProduit: product.descriptionProduit || product.description || '',
        // Normaliser l'image
        image: product.image || product.photosProduit || '',
        photosProduit: product.photosProduit || product.image || '',
        // Autres champs
        category: product.category || '',
        promotion: parseFloat(product.promotion || 0),
        animalerieId: product.animalerieId || null
      };
      
      // Pour le débogage
      //console.log(`Produit normalisé ${normalizedProduct._id}:`, 
      //  { price: normalizedProduct.price, desc: normalizedProduct.description?.substring(0, 20) });
      
      return normalizedProduct;
    });
    
    // Format de réponse compatible avec le frontend
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
    console.error(error.stack); // Afficher la stack trace pour un meilleur débogage
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
    // Utiliser l'API formData() native
    const formData = await req.formData();
    
    // Extraire les données du formulaire
    const label = formData.get('label'); 
    const price = formData.get('price');
    const promotion = formData.get('promotion');
    const description = formData.get('description');
    const category = formData.get('category');
    const imageFile = formData.get('image');
    const animalerieId = formData.get('animalerieId');
    
    // Uploader l'image à Cloudinary si présente
    let imageUrl = null;
    if (imageFile && typeof imageFile.arrayBuffer === 'function' && imageFile.size > 0) {
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
      
      // Supprimer le fichier temporaire
      await unlink(tempFilePath);
    }
    
    // Connexion à MongoDB
    const db = await connectDB();
    
    // Préparer les données du produit avec tous les champs nécessaires pour la compatibilité frontend
    const parsedPrice = parseFloat(price);
    const parsedPromotion = promotion ? parseFloat(promotion) : 0;
    
    const productData = {
      // Stocker les données sous tous les formats utilisés pour assurer la compatibilité
      label: label,
      price: parsedPrice,
      promotion: parsedPromotion,
      description: description,
      category: category,
      photosProduit: imageUrl, 
      image: imageUrl, // Ajout pour compatibilité
      animalerieId: animalerieId || null,
      createdAt: new Date()
    };
    
    // Insérer le document dans la collection 'produits'
    const result = await db.collection('produits').insertOne(productData);
    
    // Récupérer le produit complet pour le renvoyer
    const insertedProduct = await db.collection('produits').findOne({ _id: result.insertedId });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Produit créé avec succès', 
      productId: result.insertedId,
      product: insertedProduct
    });
    
  } catch (error) {
    console.error('Erreur lors de la création du produit:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Erreur lors de la création du produit' },
      { status: 500 }
    );
  }
}