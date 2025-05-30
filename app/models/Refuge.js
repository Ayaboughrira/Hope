// models/Refuge.js
import { ObjectId } from 'mongodb';

export class Refuge {
  constructor(data) {
    this.nom = data.nom;
    this.adresse = {
      wilaya: data.adresse?.wilaya || '',
      commune: data.adresse?.commune || '',
      cite: data.adresse?.cite || ''
    };
    this.contact = {
      telephone: data.contact?.telephone || '',
      email: data.contact?.email || ''
    };
    this.capacite = data.capacite;
    this.typeAnimaux = data.typeAnimaux || []; // Array: ['Cats', 'Dogs', 'Birds', etc.]
    this.description = data.description;
    this.userId = data.userId; // ObjectId référençant l'utilisateur
    this.photos = data.photos || []; // Array de { url, publicId }
    this.statut = data.statut || 'actif'; // 'actif', 'inactif', 'complet'
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Validation des données
  static validate(data) {
    const errors = [];
    
    if (!data.nom || data.nom.trim().length === 0) {
      errors.push('Le nom du refuge est requis');
    }
    
    if (!data.adresse?.wilaya) errors.push('La wilaya est requise');
    if (!data.adresse?.commune) errors.push('La commune est requise');
    if (!data.adresse?.cite) errors.push('La cité est requise');
    
    if (!data.contact?.telephone) errors.push('Le téléphone est requis');
    if (!data.contact?.email) errors.push('L\'email est requis');
    
    if (!data.capacite || isNaN(data.capacite) || parseInt(data.capacite) <= 0) {
      errors.push('La capacité doit être un nombre positif');
    }
    
    if (!data.description || data.description.trim().length === 0) {
      errors.push('La description est requise');
    }
    
    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (data.contact?.email && !emailRegex.test(data.contact.email)) {
      errors.push('Format d\'email invalide');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Méthode pour préparer les données avant insertion
  static prepareForDB(data) {
    const validation = Refuge.validate(data);
    if (!validation.isValid) {
      throw new Error(`Données invalides: ${validation.errors.join(', ')}`);
    }

    return new Refuge({
      nom: data.nom.trim(),
      adresse: {
        wilaya: data.adresse.wilaya.trim(),
        commune: data.adresse.commune.trim(),
        cite: data.adresse.cite.trim()
      },
      contact: {
        telephone: data.contact.telephone.trim(),
        email: data.contact.email.trim()
      },
      capacite: parseInt(data.capacite),
      typeAnimaux: Array.isArray(data.typeAnimaux) ? data.typeAnimaux : [],
      description: data.description.trim(),
      userId: new ObjectId(data.userId),
      photos: data.photos || [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // Méthode pour la mise à jour
  static prepareForUpdate(data) {
    const updateData = { ...data };
    
    if (updateData.capacite) {
      updateData.capacite = parseInt(updateData.capacite);
    }
    
    updateData.updatedAt = new Date();
    
    return updateData;
  }

  // Validation de la disponibilité du nom dans une wilaya
  static async validateNameAvailability(db, nom, wilaya, excludeId = null) {
    const query = { 
      nom: nom.trim(),
      'adresse.wilaya': wilaya.trim()
    };
    
    if (excludeId) {
      query._id = { $ne: new ObjectId(excludeId) };
    }
    
    const existing = await db.collection('refuge').findOne(query);
    return !existing;
  }
}