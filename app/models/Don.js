
// models/Don.js
import { ObjectId } from 'mongodb';

export class Don {
  constructor(data) {
    this.type = data.type; // 'nourriture', 'medicament', 'materiel_de_soin', 'materiel', 'autre'
    this.nom = data.nom;
    this.message = data.message || '';
    this.typeId = data.typeId; // ObjectId référençant la collection 'type'
    this.userId = data.userId; // ObjectId référençant l'utilisateur
    this.photos = data.photos || []; // Array de { url, publicId }
    this.statut = data.statut || 'disponible'; // 'disponible', 'reserve', 'donne'
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  // Validation des données
  static validate(data) {
    const errors = [];
    
    if (!data.type) errors.push('Le type de don est requis');
    if (!data.nom || data.nom.trim().length === 0) errors.push('Le nom du don est requis');
    
    const validTypes = ['nourriture', 'medicament', 'materiel_de_soin', 'materiel', 'autre'];
    if (data.type && !validTypes.includes(data.type)) {
      errors.push('Type de don invalide');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Méthode pour préparer les données avant insertion
  static prepareForDB(data) {
    const validation = Don.validate(data);
    if (!validation.isValid) {
      throw new Error(`Données invalides: ${validation.errors.join(', ')}`);
    }

    return new Don({
      type: data.type.trim(),
      nom: data.nom.trim(),
      message: data.message?.trim() || '',
      typeId: new ObjectId(data.typeId),
      userId: new ObjectId(data.userId),
      photos: data.photos || [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // Méthode pour la mise à jour
  static prepareForUpdate(data) {
    const updateData = { ...data };
    
    if (updateData.typeId) {
      updateData.typeId = new ObjectId(updateData.typeId);
    }
    
    updateData.updatedAt = new Date();
    
    return updateData;
  }
}
