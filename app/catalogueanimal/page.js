'use client'
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from '../styles/catalogueanimal.module.css';

const AnimalCatalog = () => {
  // State pour stocker les données des animaux
  const [animals, setAnimals] = useState([]);
  // State pour les filtres
  const [filters, setFilters] = useState({
    species: 'all',
    race: 'all',
    age: 'all',
    gender: 'all',
    searchTerm: ''
  });
  // État de chargement
  const [loading, setLoading] = useState(true);
  // État des favoris (maintenant géré via API)
  const [favorites, setFavorites] = useState({});
  // État d'erreur
  const [error, setError] = useState(null);
  // Données des espèces et races
  const [speciesData, setSpeciesData] = useState([]);
  const [racesData, setRacesData] = useState([]);
  // Races filtrées basées sur l'espèce sélectionnée
  const [filteredRaces, setFilteredRaces] = useState([]);
  // États de chargement pour des types de données spécifiques
  const [loadingSpecies, setLoadingSpecies] = useState(true);
  const [loadingRaces, setLoadingRaces] = useState(true);
  const [loadingAnimals, setLoadingAnimals] = useState(true);

  // Session NextAuth
  const { data: session, status } = useSession();

  // Récupérer les données des espèces
  const fetchSpecies = async () => {
    try {
      setLoadingSpecies(true);
      const response = await fetch('/api/species');
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP pour les espèces: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log('Espèces chargées:', result.data.length);
        setSpeciesData(result.data);
      } else {
        throw new Error('Échec de la récupération des données d\'espèces');
      }
    } catch (err) {
      console.error('Erreur lors du chargement des données d\'espèces:', err);
      setError('Impossible de charger les données d\'espèces. Veuillez réessayer plus tard.');
    } finally {
      setLoadingSpecies(false);
    }
  };

  // Récupérer les données des races
  const fetchRaces = async () => {
    try {
      setLoadingRaces(true);
      const response = await fetch('/api/races');
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP pour les races: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log('Races chargées:', result.data.length);
        setRacesData(result.data);
      } else {
        throw new Error('Échec de la récupération des données de races');
      }
    } catch (err) {
      console.error('Erreur lors du chargement des données de races:', err);
      setError('Impossible de charger les données de races. Veuillez réessayer plus tard.');
    } finally {
      setLoadingRaces(false);
    }
  };

  // Récupérer les données des animaux
  const fetchAnimals = async () => {
    try {
      setLoadingAnimals(true);
      const response = await fetch('/api/animals');
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP pour les animaux: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        console.log('Animaux chargés:', result.data.length);
        setAnimals(result.data);
      } else {
        throw new Error('Échec de la récupération des données d\'animaux');
      }
    } catch (err) {
      console.error('Erreur lors du chargement des données d\'animaux:', err);
      setError('Impossible de charger les données d\'animaux. Veuillez réessayer plus tard.');
    } finally {
      setLoadingAnimals(false);
    }
  };

  // Récupérer les favoris de l'utilisateur connecté
  const fetchUserFavorites = async () => {
    if (status === 'authenticated' && session) {
      try {
        const response = await fetch('/api/favorites');
        if (response.ok) {
          const { success, data } = await response.json();
          if (success && data) {
            // Convertir le tableau d'IDs en objet pour une recherche rapide
            const favoritesObj = {};
            data.forEach(id => {
              favoritesObj[id] = true;
            });
            setFavorites(favoritesObj);
          }
        }
      } catch (err) {
        console.error('Erreur lors du chargement des favoris:', err);
      }
    }
  };

  // Charger toutes les données au montage du composant
  useEffect(() => {
    // Récupérer toutes les données en parallèle
    Promise.all([
      fetchSpecies(),
      fetchRaces(),
      fetchAnimals()
    ]).then(() => {
      setLoading(false);
    }).catch(err => {
      console.error('Erreur lors de la récupération des données:', err);
      setError('Échec du chargement des données nécessaires. Veuillez réessayer plus tard.');
      setLoading(false);
    });
  }, []);

  // Charger les favoris quand la session change
  useEffect(() => {
    fetchUserFavorites();
  }, [session, status]);

  // Mettre à jour les races filtrées lorsque la sélection d'espèce change
  useEffect(() => {
    if (filters.species === 'all') {
      setFilteredRaces([]);
    } else {
      // Trouver l'objet espèce sélectionné
      const selectedSpecies = speciesData.find(species => 
        species.code === filters.species || species._id === filters.species
      );
      
      if (selectedSpecies) {
        // Filtrer les races qui appartiennent à l'espèce sélectionnée
        const speciesIdStr = String(selectedSpecies._id);
        
        const matchingRaces = racesData.filter(race => {
          const raceSpeciesId = typeof race.speciesId === 'object' 
            ? String(race.speciesId) 
            : race.speciesId;
            
          return raceSpeciesId === speciesIdStr || race.speciesId === selectedSpecies._id;
        });
        
        console.log(`${matchingRaces.length} races trouvées pour l'espèce ${selectedSpecies.name} (${speciesIdStr})`);
        setFilteredRaces(matchingRaces);
      } else {
        console.log(`Aucune espèce trouvée avec le code ${filters.species}`);
        setFilteredRaces([]);
      }
    }
    
    // Réinitialiser la sélection de race lorsque l'espèce change
    if (filters.race !== 'all') {
      setFilters(prev => ({ ...prev, race: 'all' }));
    }
  }, [filters.species, speciesData, racesData]);

  // Gestionnaire de changement de filtre
  const handleFilterChange = (filterType, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterType]: value
    }));
  };

  // Gestionnaire de recherche
  const handleSearch = (e) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      searchTerm: e.target.value
    }));
  };

  // Basculer le favori (maintenant via API)
  const toggleFavorite = async (animalId) => {
    // Vérifier si l'utilisateur est connecté
    if (status !== 'authenticated' || !session) {
      // Rediriger vers la page de connexion ou afficher un message
      alert('Vous devez être connecté pour ajouter des favoris');
      return;
    }

    try {
      const isCurrentlyFavorite = favorites[animalId];
      const action = isCurrentlyFavorite ? 'remove' : 'add';

      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          animalId: animalId,
          action: action
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const { success, isFavorite } = await response.json();
      
      if (success) {
        // Mettre à jour l'état local
        setFavorites(prev => ({
          ...prev,
          [animalId]: isFavorite
        }));
      } else {
        throw new Error('Échec de la mise à jour des favoris');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des favoris:', error);
      alert('Erreur lors de la mise à jour des favoris. Veuillez réessayer.');
    }
  };

  // Obtenir les plages d'âge par espèce
  const getAgeRanges = (species) => {
    switch (species?.toLowerCase()) {
      case 'cat':
      case 'chat':
        return {
          young: { min: 0, max: 6 },
          adult: { min: 7, max: 10 },
          senior: { min: 11, max: Infinity }
        };
      case 'dog':
      case 'chien':
        return {
          young: { min: 0, max: 5 },
          adult: { min: 6, max: 8 },
          senior: { min: 9, max: Infinity }
        };
      default:
        return {
          young: { min: 0, max: 5 },
          adult: { min: 6, max: 10 },
          senior: { min: 11, max: Infinity }
        };
    }
  };

  // Déterminer la catégorie d'âge d'un animal
  const getAgeCategory = (animal) => {
    if (!animal.age) return 'unknown';
    
    const ageNum = parseInt(animal.age);
    if (isNaN(ageNum)) return 'unknown';
    
    const species = animal.speciesCode || 
                   animal.speciesDetails?.code || 
                   'unknown';
    
    const ranges = getAgeRanges(species);
    
    if (ageNum >= ranges.young.min && ageNum <= ranges.young.max) return 'young';
    if (ageNum >= ranges.adult.min && ageNum <= ranges.adult.max) return 'adult';
    if (ageNum >= ranges.senior.min) return 'senior';
    
    return 'unknown';
  };

  // Obtenir le nom d'affichage de l'espèce
  const getSpeciesDisplayName = (speciesId) => {
    // Essayer de trouver l'espèce dans les données speciesData
    const species = speciesData.find(s => {
      const sId = typeof s._id === 'object' ? String(s._id) : s._id;
      const specId = typeof speciesId === 'object' ? String(speciesId) : speciesId;
      
      return sId === specId || s.code === speciesId;
    });
    
    if (species) {
      return species.code;
    }
    
    // Fallback vers la cartographie de base si l'espèce n'est pas trouvée
    const speciesMap = {
      'dog': 'Chien',
      'cat': 'Chat',
      'bird': 'Oiseau'
    };
    return speciesMap[speciesId] || speciesId;
  };

  // Obtenir le nom d'affichage de la race
  const getRaceDisplayName = (raceId) => {
    // Essayer de trouver la race dans les données racesData
    const race = racesData.find(r => {
      const rId = typeof r._id === 'object' ? String(r._id) : r._id;
      const raceIdStr = typeof raceId === 'object' ? String(raceId) : raceId;
      
      return rId === raceIdStr || r.code === raceId;
    });
    
    if (race) {
      return race.name;
    }
    
    // Si on ne peut pas le trouver, retourner simplement l'ID ou essayer de le formater
    if (typeof raceId === 'string' && raceId.includes('_')) {
      return raceId.split('_')[1]; // Retourner la partie après le underscore
    }
    
    return raceId;
  };

  // Filtrer les animaux selon les critères
  const filteredAnimals = animals.filter(animal => {
    // Extraire les informations d'espèce dans divers formats
    const animalSpeciesId = animal.speciesId;
    const animalSpeciesCode = animal.speciesCode;
    const speciesDetailsId = animal.speciesDetails?._id;
    const speciesDetailsCode = animal.speciesDetails?.code;
    
    // Extraire les informations de race dans divers formats
    const animalRaceId = animal.raceId;
    const animalRaceCode = animal.raceCode;
    const raceDetailsId = animal.raceDetails?._id;
    const raceDetailsCode = animal.raceDetails?.code;
    
    const animalName = animal.animalName || '';
    
    // Filtrer par espèce
    if (filters.species !== 'all') {
      // Trouver l'espèce sélectionnée dans nos données
      const selectedSpecies = speciesData.find(species => 
        species.code === filters.species || species._id === filters.species
      );
      
      if (!selectedSpecies) return false;
      
      // Convertir les IDs en chaînes pour la comparaison
      const selectedSpeciesId = String(selectedSpecies._id);
      const selectedSpeciesCode = selectedSpecies.code;
      
      // Comparer avec l'espèce de l'animal dans divers formats
      const animalSpeciesIdStr = typeof animalSpeciesId === 'object' ? 
                               String(animalSpeciesId) : 
                               animalSpeciesId;
      
      const speciesDetailsIdStr = typeof speciesDetailsId === 'object' ?
                                 String(speciesDetailsId) :
                                 speciesDetailsId;
      
      const speciesMatch = 
        animalSpeciesIdStr === selectedSpeciesId ||
        animalSpeciesCode === selectedSpeciesCode ||
        speciesDetailsIdStr === selectedSpeciesId ||
        speciesDetailsCode === selectedSpeciesCode;
        
      if (!speciesMatch) return false;
    }
    
    // Filtrer par race
    if (filters.race !== 'all') {
      // Trouver la race sélectionnée dans nos données
      const selectedRace = racesData.find(race => 
        race.code === filters.race || race._id === filters.race
      );
      
      if (!selectedRace) return false;
      
      // Convertir les IDs en chaînes pour la comparaison
      const selectedRaceId = String(selectedRace._id);
      const selectedRaceCode = selectedRace.code;
      
      // Comparer avec la race de l'animal dans divers formats
      const animalRaceIdStr = typeof animalRaceId === 'object' ? 
                            String(animalRaceId) : 
                            animalRaceId;
      
      const raceDetailsIdStr = typeof raceDetailsId === 'object' ?
                             String(raceDetailsId) :
                             raceDetailsId;
      
      const raceMatch = 
        animalRaceIdStr === selectedRaceId ||
        animalRaceCode === selectedRaceCode ||
        raceDetailsIdStr === selectedRaceId ||
        raceDetailsCode === selectedRaceCode;
        
      if (!raceMatch) return false;
    }
    
    // Filtrer par âge en utilisant la fonction getAgeCategory
    if (filters.age !== 'all' && getAgeCategory(animal) !== filters.age) return false;
    
    // Filtrer par sexe
    if (filters.gender !== 'all' && animal.gender?.toLowerCase() !== filters.gender) return false;
    
    // Rechercher par terme
    if (filters.searchTerm && !animalName.toLowerCase().includes(filters.searchTerm.toLowerCase())) return false;
    
    return true;
  });

  // Obtenir les options de sexe
  const genderOptions = ['all', 'male', 'female'];

  return (
    <div className={styles.animalCatalog}>
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1>Animal Catalog</h1>
          <div className={styles.adoptionInfo}>
            <h2> Responsible Adoption</h2>
            <p>
              Adopting an animal is a long-term commitment that requires love, patience, and responsibility.
              Every animal deserves a loving home where it will be cared for and respected.
              Before adopting, make sure you are ready to provide the time, space, and resources necessary to ensure the well-being of your new friend. 
              Together, we can create happy adoptions that last a lifetime.
            </p>
          </div>
        </div>
      </div>
      
      
      <div className={styles.mainContent}>
        <div className={styles.sidebar}>
          <h3>Filter by</h3>
          <div className={styles.filterGroup}>
            <label htmlFor="species-filter">Species:</label>
            {loadingSpecies ? (
              <p className={styles.loadingStatus}>Loading species...</p>
            ) : (
              <select 
                id="species-filter" 
                value={filters.species} 
                onChange={(e) => handleFilterChange('species', e.target.value)}
              >
                <option value="all">All species</option>
                {speciesData.map(species => (
                  <option key={species._id} value={species.code}>
                    {species.code}
                  </option>
                ))}
              </select>
            )}
          </div>
          
          {filters.species !== 'all' && (
            <div className={styles.filterGroup}>
              <label htmlFor="race-filter">Breed:</label>
              {loadingRaces ? (
                <p className={styles.loadingStatus}>Loading breeds...</p>
              ) : filteredRaces.length > 0 ? (
                <select 
                  id="race-filter" 
                  value={filters.race} 
                  onChange={(e) => handleFilterChange('race', e.target.value)}
                >
                  <option value="all">All races</option>
                  {filteredRaces.map(race => (
                    <option key={race._id} value={race.code}>
                      {race.name}
                    </option>
                  ))}
                </select>
              ) : (
                <p className={styles.noDataStatus}>No races available for this species</p>
              )}
            </div>
          )}
          
          <div className={styles.filterGroup}>
            <label htmlFor="age-filter">Age:</label>
            <select 
              id="age-filter" 
              value={filters.age} 
              onChange={(e) => handleFilterChange('age', e.target.value)}
            >
              <option value="all">All ages</option>
              <option value="young">Young</option>
              <option value="adult">Adult</option>
              <option value="senior">Senior</option>
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label htmlFor="gender-filter">Gender:</label>
            <select 
              id="gender-filter" 
              value={filters.gender} 
              onChange={(e) => handleFilterChange('gender', e.target.value)}
            >
              {genderOptions.map(gender => (
                <option key={gender} value={gender}>
                  {gender === 'all' ? 'All genders' : gender.charAt(0).toUpperCase() + gender.slice(1)}
                </option>
              ))}
            </select>
          </div>
          
          <div className={`${styles.filterGroup} ${styles.search}`}>
            <label htmlFor="search-input">Search:</label>
            <input 
              id="search-input"
              type="text" 
              placeholder="Search by name..." 
              value={filters.searchTerm} 
              onChange={handleSearch}
            />
          </div>
        </div>
        
        <div className={styles.contentArea}>
          {loading ? (
            <div className={styles.loading}>Loading data...</div>
          ) : error ? (
            <div className={styles.error}>{error}</div>
          ) : (
            <>
              {/* Horizontal species filter bar */}
              <div className={styles.speciesFilterBar}>
                <button
                  className={`${styles.speciesFilterButton} ${filters.species === 'all' ? styles.active : ''}`}
                  onClick={() => handleFilterChange('species', 'all')}
                >
                  All species
                </button>
                {loadingSpecies ? (
                  <span className={styles.loadingChips}>Loading...</span>
                ) : (
                  speciesData.map(species => (
                    <button
                      key={species._id}
                      className={`${styles.speciesFilterButton} ${filters.species === species.code ? styles.active : ''}`}
                      onClick={() => handleFilterChange('species', species.code)}
                    >
                      {species.code}
                    </button>
                  ))
                )}
              </div>
              
             
              
              <div className={styles.animalsGrid}>
                {loadingAnimals ? (
                  <div className={styles.loading}>Loading animals...</div>
                ) : filteredAnimals.length > 0 ? (
                  filteredAnimals.map(animal => {
                    const animalId = animal._id;
                    const animalName = animal.animalName || '';
                    
                    // Get species name from speciesDetails or from our species data
                    const speciesId = animal.speciesId || animal.speciesDetails?._id;
                    const speciesCode = animal.speciesCode || animal.speciesDetails?.code;
                    const animalSpecies = animal.speciesDetails?.name || 
                                         getSpeciesDisplayName(speciesCode || speciesId) || 
                                         'Unknown';
                    
                    // Handle different photo structures
                    let imageUrl = '/placeholder-animal.jpg';
                    if (animal.photos && animal.photos.length > 0) {
                      if (typeof animal.photos[0] === 'string') {
                        imageUrl = animal.photos[0];
                      } else if (animal.photos[0].url) {
                        imageUrl = animal.photos[0].url;
                      }
                    }
                    
                    // Get race name from raceDetails or from our race data
                    const raceId = animal.raceId || animal.raceDetails?._id;
                    const raceCode = animal.raceCode || animal.raceDetails?.code;
                    const animalRace = animal.raceDetails?.name || 
                                      getRaceDisplayName(raceCode || raceId);
                    
                    return (
                      <div key={animalId} className={styles.animalCard}>
                        <Link href={`/catalogueanimal/${animalId}`} className={styles.animalLink}>
                          <div className={styles.animalImage}>
                            <img src={imageUrl} alt={animalName || 'Animal'} />
                            <button 
                              className={`${styles.favoriteBtn} ${favorites[animalId] ? styles.active : ''}`}
                              onClick={(e) => {
                                e.preventDefault(); // Prevent navigation to the detail page
                                toggleFavorite(animalId);
                              }}
                              aria-label={favorites[animalId] ? "Remove from favorites" : "Add to favorites"}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={favorites[animalId] ? "red" : "none"} stroke="currentColor" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                              </svg>
                            </button>
                          </div>
                          <div className={styles.animalInfo}>
                            <h3>{animalName || 'Unnamed'}</h3>
                            <div className={styles.infoRow}>
                              <p><strong>Species:</strong> {animalSpecies}</p>
                              <p className={styles.gender}>
                                <strong>Gender:</strong> 
                                <span className={styles.genderIcon}>
                                  {(animal.gender?.toLowerCase() === 'male') ? (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="blue" strokeWidth="2">
                                      <circle cx="10.5" cy="10.5" r="7.5" />
                                      <line x1="18" y1="18" x2="22" y2="22" />
                                      <line x1="22" y1="15" x2="22" y2="22" />
                                      <line x1="15" y1="22" x2="22" y2="22" />
                                    </svg>
                                  ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="rgb(216, 15, 156)" strokeWidth="2">
                                      <circle cx="12" cy="8" r="7" />
                                      <line x1="12" y1="15" x2="12" y2="22" />
                                      <line x1="9" y1="19" x2="15" y2="19" />
                                    </svg>
                                  )}
                                  {animal.gender || 'Unknown'}
                                </span>
                              </p>
                            </div>
                            <p><strong>Age:</strong> {animal.age || 'Unknown'} {animal.age === '1' ? 'an' : 'ans'}</p>
                            {animalRace && <p><strong>Race:</strong> {animalRace}</p>}
                            <p className={styles.description}>{animal.description ? `${animal.description.substring(0, 100)}${animal.description.length > 100 ? '...' : ''}` : ''}</p>
                          </div>
                        </Link>
                      </div>
                    );
                  })
                ) : (
                  <div className={styles.noResults}>No animals match your search criteria.</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnimalCatalog;