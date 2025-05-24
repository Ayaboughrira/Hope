'use client'
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { X, Edit, Trash2, Search, Filter, ChevronDown, AlertCircle } from 'lucide-react';
import styles from '../styles/mesanimaux.module.css';

const MesAnimaux = () => {
  // États pour la gestion des données et de l'interface
  const [animals, setAnimals] = useState([]);
  const [filteredAnimals, setFilteredAnimals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [animalToDelete, setAnimalToDelete] = useState(null);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtres
  const [activeFilters, setActiveFilters] = useState({
    species: 'all',
    age: 'all',
    gender: 'all'
  });
  
  // Options disponibles
  const [speciesOptions, setSpeciesOptions] = useState(['all']);
  
  // Récupération de la session utilisateur
  const { data: session, status } = useSession();

  // Récupération des données au chargement
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      setError('You must connect to access this section ');
      setLoading(false);
      return;
    }
    
    fetchAnimals();
  }, [session, status]);
  
  // Application des filtres lorsqu'ils changent
  useEffect(() => {
    if (animals.length > 0) {
      applyFilters();
    }
  }, [animals, activeFilters, searchTerm]);
  
  // Fonction pour récupérer les animaux de l'utilisateur
  const fetchAnimals = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/animals/mesanimaux');
      
      if (!response.ok) {
        throw new Error(`Erreur serveur: ${response.status}`);
      }
      
      const { success, data } = await response.json();
      
      if (success) {
        setAnimals(data);
        setFilteredAnimals(data);
        
        // Extraction des espèces uniques
        const uniqueSpecies = ['all', ...new Set(data.map(animal => 
          animal.speciesDetails?.code || animal.speciesCode || 'unknown'
        ).filter(Boolean))];
        
        setSpeciesOptions(uniqueSpecies);
      } else {
        throw new Error('Échec de récupération des données');
      }
    } catch (err) {
      console.error('Erreur:', err);
      setError(err.message || 'Impossible de charger vos annonces');
    } finally {
      setLoading(false);
    }
  };
  
  // Application des filtres
  const applyFilters = () => {
    const filtered = animals.filter(animal => {
      // Récupération des valeurs pour la comparaison
      const animalSpecies = animal.speciesDetails?.code || animal.speciesCode || 'unknown';
      const animalName = animal.animalName || '';
      const animalAge = getAgeCategory(animal);
      const animalGender = animal.gender?.toLowerCase() || 'unknown';
      
      // Application des filtres
      if (activeFilters.species !== 'all' && animalSpecies !== activeFilters.species) return false;
      if (activeFilters.age !== 'all' && animalAge !== activeFilters.age) return false;
      if (activeFilters.gender !== 'all' && animalGender !== activeFilters.gender) return false;
      
      // Recherche par nom
      if (searchTerm && !animalName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      
      return true;
    });
    
    setFilteredAnimals(filtered);
  };
  
  // Gestion du changement de filtre
  const handleFilterChange = (filterName, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
  };
  
  // Fonction pour déterminer la catégorie d'âge
  const getAgeCategory = (animal) => {
    if (!animal.age) return 'unknown';
    
    const ageNum = parseInt(animal.age);
    if (isNaN(ageNum)) return 'unknown';
    
    const species = animal.speciesCode || animal.speciesDetails?.code || 'unknown';
    
    // Tranches d'âge selon l'espèce
    switch (species.toLowerCase()) {
      case 'cat':
        if (ageNum <= 6) return 'young';
        if (ageNum <= 10) return 'adult';
        return 'senior';
      case 'dog':
        if (ageNum <= 5) return 'young';
        if (ageNum <= 8) return 'adult';
        return 'senior';
      default:
        if (ageNum <= 5) return 'young';
        if (ageNum <= 10) return 'adult';
        return 'senior';
    }
  };
  
  // Fonction pour obtenir le nom d'affichage de l'espèce
  const getSpeciesDisplayName = (code) => {
    const speciesMap = {
      'dog': 'Dog',
      'cat': 'Cat',
      'bird': 'Bird'
    };
    return speciesMap[code] || code;
  };
  
  // Fonction pour ouvrir la fenêtre modale de suppression
  const openDeleteModal = (animalId, e) => {
    e.preventDefault();
    e.stopPropagation();
    setAnimalToDelete(animalId);
    setDeleteModalOpen(true);
  };
  
  // Fonction pour fermer la fenêtre modale de suppression
  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setAnimalToDelete(null);
  };
  
  // Fonction pour supprimer un animal
  const deleteAnimal = async () => {
    if (!animalToDelete || !session) {
      closeDeleteModal();
      return;
    }
    
    try {
      const userData = {
        userId: session.user.id,
        userType: session.user.userType
      };
      
      const response = await fetch(`/api/animals/${animalToDelete}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Mise à jour de la liste
        setAnimals(prev => prev.filter(animal => animal._id !== animalToDelete));
        setFilteredAnimals(prev => prev.filter(animal => animal._id !== animalToDelete));
      } else {
        throw new Error(result.message || 'Échec de la suppression');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert(`Erreur: ${error.message}`);
    } finally {
      closeDeleteModal();
    }
  };

  return (
    <div className={styles.container}>
      {/* En-tête */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerInner}>
            <Link href="/annonceanimal" className={styles.addButton}>
              Posting an ad
            </Link>
          </div>
        </div>
      </header>

      {/* Contenu principal */}
      <main className={styles.main}>
        <div className={styles.mainContent}>
          {/* En-tête de section avec filtres */}
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderInner}>
              <div className={styles.sectionInfo}>
                <h2 className={styles.sectionTitle}>
                  Manage my {filteredAnimals.length} ad {filteredAnimals.length !== 1 ? 's' : ''} for adoption
                </h2>
                <p className={styles.sectionDescription}>
                  View or remove my adoption ads.
                </p>
              </div>
              
              {/* Recherche */}
              <div className={styles.searchContainer}>
                <div className={styles.searchInput}>
                  <div className={styles.searchIcon}>
                    <Search className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchField}
                  />
                </div>
              </div>
              
              {/* Filtres */}
              <div className={styles.filterWrapper}>
                <button
                  type="button"
                  onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                  className={styles.filterButton}
                >
                  <Filter className="h-4 w-4" />
                  Filtrer
                  <ChevronDown className={`h-4 w-4 transition-transform ${isFilterMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isFilterMenuOpen && (
                  <div className={styles.filterMenu}>
                    <div className={styles.filterMenuHeader}>
                      <h3 className={styles.filterMenuTitle}>Filtres</h3>
                    </div>
                    
                    {/* Filtre par espèce */}
                    <div className={styles.filterGroup}>
                      <label htmlFor="species-filter" className={styles.filterLabel}>
                        Species
                      </label>
                      <select
                        id="species-filter"
                        value={activeFilters.species}
                        onChange={(e) => handleFilterChange('species', e.target.value)}
                        className={styles.filterSelect}
                      >
                        <option value="all">All species</option>
                        {speciesOptions.filter(species => species !== 'all').map(species => (
                          <option key={species} value={species}>
                            {getSpeciesDisplayName(species)}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Filtre par âge */}
                    <div className={styles.filterGroup}>
                      <label htmlFor="age-filter" className={styles.filterLabel}>
                        Age
                      </label>
                      <select
                        id="age-filter"
                        value={activeFilters.age}
                        onChange={(e) => handleFilterChange('age', e.target.value)}
                        className={styles.filterSelect}
                      >
                        <option value="all">All ages</option>
                        <option value="young">Young</option>
                        <option value="adult">Adult</option>
                        <option value="senior">Senior</option>
                      </select>
                    </div>
                    
                    {/* Filtre par genre */}
                    <div className={styles.filterGroup}>
                      <label htmlFor="gender-filter" className={styles.filterLabel}>
                        Gender
                      </label>
                      <select
                        id="gender-filter"
                        value={activeFilters.gender}
                        onChange={(e) => handleFilterChange('gender', e.target.value)}
                        className={styles.filterSelect}
                      >
                        <option value="all">All genders</option>  
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* État de chargement */}
          {loading && (
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p className={styles.loadingText}>Loading your ads...</p>
            </div>
          )}

          {/* Message d'erreur */}
          {error && !loading && (
            <div className={styles.errorContainer}>
              <AlertCircle className="h-8 w-8" />
              <p className={styles.errorMessage}>{error}</p>
            </div>
          )}

          {/* Liste des animaux */}
          {!loading && !error && filteredAnimals.length === 0 && (
            <div className={styles.emptyContainer}>
              <p className={styles.emptyMessage}>You don't have an adoption ad yet.</p>
              <Link href="/annonceanimal" className={styles.emptyActionButton}>
                Creat my first ad
              </Link>
            </div>
          )}

          {/* Grille d'annonces */}
          {!loading && !error && filteredAnimals.length > 0 && (
            <div className={styles.animalGrid}>
              {filteredAnimals.map((animal) => (
                <div key={animal._id} className={styles.animalCard}>
                  <div className={styles.animalCardInner}>
                    {/* Image de l'animal */}
                    <div className={styles.animalImageContainer}>
                      {animal.photos && animal.photos.length > 0 ? (
                        <img
                          src={animal.photos[0].url}
                          alt={animal.animalName}
                          className={styles.animalImage}
                        />
                      ) : (
                        <div className={styles.animalImagePlaceholder}>
                          <span className={styles.animalImagePlaceholderText}>
                            No photo
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Informations de l'animal */}
                    <div className={styles.animalInfo}>
                      <h3 className={styles.animalName}>{animal.animalName || "Sans nom"}</h3>
                      <div className={styles.animalDetails}>
                        <div className={styles.animalDetail}>
                          <span className={styles.detailLabel}>Species:</span>
                          <span className={styles.detailValue}>
                            {animal.speciesDetails?.name || getSpeciesDisplayName(animal.speciesCode) || "Inconnue"}
                          </span>
                        </div>
                        
                        {animal.raceDetails && (
                          <div className={styles.animalDetail}>
                            <span className={styles.detailLabel}>Breed:</span>
                            <span className={styles.detailValue}>
                              {animal.raceDetails.name || "Non spécifiée"}
                            </span>
                          </div>
                        )}
                        
                        <div className={styles.animalDetail}>
                          <span className={styles.detailLabel}>Age:</span>
                          <span className={styles.detailValue}>
                            {animal.age ? `${animal.age} years` : "Not specified"}
                          </span>
                        </div>
                        
                        <div className={styles.animalDetail}>
                          <span className={styles.detailLabel}>Gender:</span>
                          <span className={styles.detailValue}>
                            {animal.gender === 'male' ? 'Mâle' : animal.gender === 'female' ? 'Femelle' : 'Non spécifié'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Boutons d'action maintenant positionnés en bas */}
                    <div className={styles.cardButtonsContainer}>
                      
                      <button
                        type="button"
                        className={styles.cardDeleteButton}
                        onClick={(e) => openDeleteModal(animal._id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
        </div>
      </main>

      {/* Fenêtre modale de confirmation de suppression */}
      {deleteModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContainer}>
            <button
              type="button"
              className={styles.modalCloseButton}
              onClick={closeDeleteModal}
            >
              <X className="h-6 w-6" />
            </button>
            
            <div className={styles.modalContent}>
              <div className={styles.modalHeader}>
                <div className={styles.modalIcon}>
                  <AlertCircle className="h-6 w-6" />
                </div>
                <div className={styles.modalText}>
                  <h3 className={styles.modalTitle}>Confirm the deletion</h3>
                  <div className={styles.modalMessage}>
                    <p>
                      Are you sure want to delete this ad ? this action is irreversible!
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.deleteButton}
                onClick={deleteAnimal}
              >
                Delete
              </button>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={closeDeleteModal}
              >
               Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MesAnimaux;