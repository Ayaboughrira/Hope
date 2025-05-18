// app/models/species.js
/**
 * Crée un objet espèce validé
 * @param {Object} data - Les données de l'espèce
 * @returns {Object} Un objet espèce validé
 */
export function createSpeciesObject(data) {
  return {
    code: data.code,
    name: data.name || getSpeciesName(data.code),
    description: data.description || '',
    createdAt: new Date()
  };
}

/**
 * Valide un objet espèce
 * @param {Object} species - L'objet espèce à valider
 * @throws {Error} Lance une erreur si la validation échoue
 */
export function validateSpecies(species) {
  if (!species.code) {
    throw new Error("Le code de l'espèce est obligatoire");
  }
  
  if (!species.name) {
    throw new Error("Le nom de l'espèce est obligatoire");
  }
  
  return true;
}

/**
 * Crée un objet race validé
 * @param {Object} data - Les données de la race
 * @returns {Object} Un objet race validé
 */
export function createRaceObject(data) {
  return {
    code: data.code,
    name: data.name || getRaceName(data.code),
    speciesCode: data.speciesCode,
    speciesId: data.speciesId,
    description: data.description || '',
    createdAt: new Date()
  };
}

/**
 * Valide un objet race
 * @param {Object} race - L'objet race à valider
 * @throws {Error} Lance une erreur si la validation échoue
 */
export function validateRace(race) {
  if (!race.code) {
    throw new Error("Le code de la race est obligatoire");
  }
  
  if (!race.name) {
    throw new Error("Le nom de la race est obligatoire");
  }
  
  if (!race.speciesId) {
    throw new Error("L'identifiant de l'espèce est obligatoire");
  }
  
  if (!race.speciesCode) {
    throw new Error("Le code de l'espèce est obligatoire");
  }
  
  return true;
}

// Fonction auxiliaire pour obtenir le nom de l'espèce à partir de son code
function getSpeciesName(speciesCode) {
  const speciesMap = {
    'dog': 'Chien',
    'cat': 'Chat',
    'bird': 'Oiseau'
  };
  return speciesMap[speciesCode] || speciesCode;
}

// Fonction auxiliaire pour obtenir le nom de la race à partir de son code
function getRaceName(raceCode) {
  const raceMap = {
    // Races de chiens
    'dog_labrador': 'Labrador Retriever',
    'dog_germanshepherd': 'Berger Allemand',
    'dog_goldenretriever': 'Golden Retriever',
    'dog_bulldog': 'Bulldog',
    'dog_beagle': 'Beagle',
    'dog_poodle': 'Caniche',
    
    // Races de chats
    'cat_persian': 'Persan',
    'cat_siamese': 'Siamois',
    'cat_mainecoon': 'Maine Coon',
    'cat_ragdoll': 'Ragdoll',
    'cat_bengal': 'Bengal',
    'cat_sphynx': 'Sphynx',
    
    // Races d'oiseaux
    'bird_canary': 'Canari',
    'bird_parakeet': 'Perruche',
    'bird_cockatiel': 'Cockatiel',
    'bird_lovebird': 'Inséparable',
    'bird_finch': 'Pinson',
    'bird_parrot': 'Perroquet'
  };
  return raceMap[raceCode] || raceCode;
}