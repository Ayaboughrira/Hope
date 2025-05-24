// models/animals.js
import { ObjectId } from 'mongodb';

/**
 * Crée un objet animal validé à partir des données brutes
 * @param {Object} data - Les données brutes du formulaire
 * @returns {Object} Un objet animal validé
 */
export function createAnimalObject(data) {
  return {
    // Informations de base sur l'animal
    animalName: data.animalName,
    speciesId: data.speciesId instanceof ObjectId ? data.speciesId : new ObjectId(data.speciesId),
    speciesCode: data.speciesCode || null,
    raceId: data.raceId ? (data.raceId instanceof ObjectId ? data.raceId : new ObjectId(data.raceId)) : null,
    raceCode: data.raceCode || null,
    age: data.age || '',
    gender: data.gender || '',
    description: data.description || '',
    
    // Informations sur le propriétaire/contact
    ownerName: data.ownerName,
    ownerEmail: data.ownerEmail,
    ownerPhone: data.ownerPhone,
    ownerAddress: data.ownerAddress || '',
    
    // Média
    photos: data.photos || [],
    
    // Informations sur le publicateur
    publishType: data.publishType,
    publishId: data.publishId,
    publishDate: data.publishDate || new Date(),
    
    // État de l'annonce
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

/**
 * Valide un objet animal
 * @param {Object} animal - L'objet animal à valider
 * @throws {Error} Lance une erreur si la validation échoue
 */
export function validateAnimal(animal) {
  // Validation des champs obligatoires
  if (!animal.animalName) {
    throw new Error('Le nom de l\'animal est obligatoire');
  }
  
  if (!animal.speciesId) {
    throw new Error('L\'espèce de l\'animal est obligatoire');
  }
  
  // La race peut être optionnelle selon vos besoins
  
  if (!animal.ownerName) {
    throw new Error('Le nom du propriétaire est obligatoire');
  }
  
  if (!animal.ownerEmail) {
    throw new Error('L\'email du propriétaire est obligatoire');
  }
  
  if (!animal.ownerPhone) {
    throw new Error('Le téléphone du propriétaire est obligatoire');
  }
  
  if (!animal.photos || animal.photos.length === 0) {
    throw new Error('Au moins une photo est requise');
  }
  
  // Validation des informations sur le publicateur
  if (!animal.publishType) {
    throw new Error('Le type de publicateur est obligatoire');
  }
  
  if (!animal.publishId) {
    throw new Error('L\'ID du publicateur est obligatoire');
  }
  
  return true;
}