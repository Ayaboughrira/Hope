'use client'
import React, { useState, useEffect } from 'react';
import styles from '../styles/catalogueanimal.module.css'; 
import Link from 'next/link';

const AnimalCatalog = () => {
  // State for storing animal data
  const [animals, setAnimals] = useState([]);
  // State for filters
  const [filters, setFilters] = useState({
    species: 'all',
    age: 'all',
    gender: 'all',
    searchTerm: ''
  });
  // Loading state
  const [loading, setLoading] = useState(true);
  // Favorites state
  const [favorites, setFavorites] = useState({});
  // Error state
  const [error, setError] = useState(null);
  // Species options state
  const [speciesOptions, setSpeciesOptions] = useState(['all']);

  useEffect(() => {
    // Load favorites from localStorage on startup
    const savedFavorites = localStorage.getItem('animalFavorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }
    
    const fetchAnimals = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/animals');
        
        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status}`);
        }
        
        const { success, data } = await response.json();
        
        if (success) {
          setAnimals(data);
          
          // Extract unique species from the data
          const uniqueSpecies = ['all', ...new Set(data.map(animal => 
            animal.speciesDetails?.code || animal.speciesCode || 'unknown'
          ).filter(Boolean))];
          
          setSpeciesOptions(uniqueSpecies);
        } else {
          throw new Error('Failed to retrieve data');
        }
      } catch (err) {
        console.error('Error loading animals:', err);
        setError('Unable to load animals. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnimals();
  }, []);

  // Filter change handler
  const handleFilterChange = (filterType, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterType]: value
    }));
  };

  // Search handler
  const handleSearch = (e) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      searchTerm: e.target.value
    }));
  };

  // Toggle favorite
  const toggleFavorite = (id) => {
    setFavorites(prev => {
      const newFavorites = {
        ...prev,
        [id]: !prev[id]
      };
      
      // Save to localStorage
      localStorage.setItem('animalFavorites', JSON.stringify(newFavorites));
      
      return newFavorites;
    });
  };

  // Get age ranges by species
  const getAgeRanges = (species) => {
    switch (species?.toLowerCase()) {
      case 'cat':
        return {
          young: { min: 0, max: 6 },
          adult: { min: 7, max: 10 },
          senior: { min: 11, max: Infinity }
        };
      case 'dog':
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

  // Determine the age category of an animal
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

  // Get species display name
  const getSpeciesDisplayName = (code) => {
    const speciesMap = {
      'dog': 'Dog',
      'cat': 'Cat',
      'bird': 'Bird'
    };
    return speciesMap[code] || code;
  };

  // Filter animals according to criteria
  const filteredAnimals = animals.filter(animal => {
    const animalSpecies = animal.speciesCode || animal.speciesDetails?.code || 'unknown';
    const animalName = animal.animalName || '';
    
    // Filter by species
    if (filters.species !== 'all' && animalSpecies !== filters.species) return false;
    
    // Filter by age using the getAgeCategory function
    if (filters.age !== 'all' && getAgeCategory(animal) !== filters.age) return false;
    
    // Filter by gender
    if (filters.gender !== 'all' && animal.gender?.toLowerCase() !== filters.gender) return false;
    
    // Search by term
    if (filters.searchTerm && !animalName.toLowerCase().includes(filters.searchTerm.toLowerCase())) return false;
    
    return true;
  });

  // Get gender options
  const genderOptions = ['all', 'male', 'female'];

  return (
    <div className={styles.animalCatalog}>
      <div className={styles.heroSection}>
        <div className={styles.heroContent}>
          <h1>Animal Catalog</h1>
          <div className={styles.adoptionInfo}>
            <h2>Responsible Adoption</h2>
            <p>
              Adopting an animal is a long-term commitment that requires love, patience and responsibility. 
              Each animal deserves a loving home where it will be cared for and respected. Before adopting, 
              make sure you are prepared to offer the necessary time, space and resources to ensure the well-being 
              of your new friend. Together, we can create happy adoptions that last a lifetime.
            </p>
          </div>
        </div>
      </div>
      
      <div className={styles.mainContent}>
        <div className={styles.sidebar}>
          <h3>Filter by</h3>
          <div className={styles.filterGroup}>
            <label htmlFor="species-filter">Species:</label>
            <select 
              id="species-filter" 
              value={filters.species} 
              onChange={(e) => handleFilterChange('species', e.target.value)}
            >
              <option value="all">All species</option>
              {speciesOptions.filter(species => species !== 'all').map(species => (
                <option key={species} value={species}>
                  {getSpeciesDisplayName(species)}
                </option>
              ))}
            </select>
          </div>
          
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
                {speciesOptions.map(species => (
                  <button
                    key={species}
                    className={`${styles.speciesFilterButton} ${filters.species === species ? styles.active : ''}`}
                    onClick={() => handleFilterChange('species', species)}
                  >
                    {species === 'all' ? 'All species' : getSpeciesDisplayName(species)}
                  </button>
                ))}
              </div>
              
              <div className={styles.animalsGrid}>
                {filteredAnimals.length > 0 ? (
                  filteredAnimals.map(animal => {
                    const animalId = animal._id;
                    const animalName = animal.animalName || '';
                    const animalSpecies = animal.speciesDetails?.name || 
                                          getSpeciesDisplayName(animal.speciesCode) || 
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
                    
                    const animalRace = animal.raceDetails?.name || 
                                      (animal.raceCode ? animal.raceCode.replace(/^[^_]+_/, '') : null);
                    
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