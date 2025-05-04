// models/index.js
// Ce fichier définit les collections pour chaque type d'utilisateur

export const USER_COLLECTIONS = {
    owner: 'owners',
    vet: 'vets',
    store: 'stores',
    association: 'associations'
  };
  
  // Fonction pour obtenir la collection appropriée selon le type d'utilisateur
  export function getUserCollection(db, userType) {
    if (!USER_COLLECTIONS[userType]) {
      throw new Error(`Type d'utilisateur non valide: ${userType}`);
    }
    
    return db.collection(USER_COLLECTIONS[userType]);
  }