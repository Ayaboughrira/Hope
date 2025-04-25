// models/Animal.js
// Ce fichier est optionnel mais utile pour définir clairement la structure de vos données

/**
 * Représente le schéma d'un animal dans la base de données
 * 
 * @typedef {Object} Animal
 * @property {string} animalName - Le nom de l'animal
 * @property {string} animalType - Le type d'animal (chien, chat, etc.)
 * @property {string} race - La race de l'animal
 * @property {string} age - L'âge de l'animal
 * @property {string} gender - Le genre de l'animal (male/female)
 * @property {string} description - Description de l'animal
 * @property {string} ownerName - Nom du propriétaire
 * @property {string} ownerEmail - Email du propriétaire
 * @property {string} ownerPhone - Téléphone du propriétaire
 * @property {string} ownerAddress - Adresse du propriétaire
 * @property {Array<Object>} photos - Liste des photos avec URL et ID public
 * @property {string} videoUrl - URL de la vidéo (si disponible)
 * @property {string} videoPublicId - ID public de la vidéo sur Cloudinary
 * @property {Date} createdAt - Date de création de l'annonce
 */

/**
 * Validation des données d'un animal
 * @param {Animal} animal - Les données de l'animal à valider
 * @returns {boolean} - True si les données sont valides
 * @throws {Error} - Une erreur si les données sont invalides
 */
export function validateAnimal(animal) {
    const requiredFields = ['animalName', 'animalType', 'ownerName', 'ownerEmail', 'ownerPhone'];
    
    for (const field of requiredFields) {
      if (!animal[field]) {
        throw new Error(`Le champ ${field} est obligatoire`);
      }
    }
    
    if (!animal.photos || animal.photos.length === 0) {
      throw new Error('Au moins une photo est requise');
    }
    
    return true;
  }
  
  /**
   * Crée un objet animal pour insertion dans la base de données
   * @param {Object} data - Les données brutes
   * @returns {Animal} - L'objet animal formaté
   */
  export function createAnimalObject(data) {
    return {
      animalName: data.animalName || '',
      animalType: data.animalType || '',
      race: data.race || '',
      age: data.age || '',
      gender: data.gender || '',
      description: data.description || '',
      ownerName: data.ownerName || '',
      ownerEmail: data.ownerEmail || '',
      ownerPhone: data.ownerPhone || '',
      ownerAddress: data.ownerAddress || '',
      photos: data.photos || [],
      videoUrl: data.videoUrl || '',
      videoPublicId: data.videoPublicId || '',
      createdAt: new Date()
    };
  }