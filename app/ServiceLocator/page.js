"use client";

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import styles from '../styles/serviceLocator.module.css';

// SVG Icons for the component
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const LocationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const MapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
    <line x1="8" y1="2" x2="8" y2="18"></line>
    <line x1="16" y1="6" x2="16" y2="22"></line>
  </svg>
);

const VetIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Z"></path>
    <path d="m9 14 2 2 4-4"></path>
    <path d="M12 6v2"></path>
    <path d="M12 10h.01"></path>
  </svg>
);

const AssociationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 22h4a2 2 0 0 0 2-2v-1a5 5 0 0 0-5-5 3 3 0 1 0 0-6 5 5 0 0 0 5-5v-1a2 2 0 0 0-2-2h-4"></path>
    <path d="M8 22H4a2 2 0 0 1-2-2v-1a5 5 0 0 1 5-5 3 3 0 1 1 0-6 5 5 0 0 1-5-5V2a2 2 0 0 1 2-2h4"></path>
  </svg>
);

const PetShopIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 13v6a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-6"></path>
    <path d="M21 5H3a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z"></path>
  </svg>
);

// Wilayas d'Algérie
const ALGERIA_WILAYAS = [
  "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra",
  "Béchar", "Blida", "Bouira", "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret",
  "Tizi Ouzou", "Alger", "Djelfa", "Jijel", "Sétif", "Saïda", "Skikda",
  "Sidi Bel Abbès", "Annaba", "Guelma", "Constantine", "Médéa", "Mostaganem",
  "M'Sila", "Mascara", "Ouargla", "Oran", "El Bayadh", "Illizi", "Bordj Bou Arréridj",
  "Boumerdès", "El Tarf", "Tindouf", "Tissemsilt", "El Oued", "Khenchela",
  "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", "Naâma", "Aïn Témouchent",
  "Ghardaïa", "Relizane"
];

// Composant principal qui utilise useSearchParams (doit être dans Suspense)
function ServiceLocatorContent() {
  const [filters, setFilters] = useState({
    veterinarian: true,
    association: true,
    petshop: true
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredServices, setFilteredServices] = useState([]);
  const [allServices, setAllServices] = useState({
    veterinarian: [],
    association: [],
    petshop: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const searchParams = useSearchParams();
  
  // Fonction pour récupérer tous les services depuis l'API
  const fetchAllServices = useCallback(async () => {
    try {
      console.log('Récupération des services...');
      const response = await fetch('/api/services');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Réponse API:', data);
      
      if (data.success) {
        return data.services || {
          veterinarian: [],
          association: [],
          petshop: []
        };
      } else {
        console.error('Erreur API:', data.message);
        throw new Error(data.message || 'Erreur lors de la récupération des services');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des services:', error);
      throw error;
    }
  }, []);

  // Fonction pour appliquer les filtres et la recherche
  const applyFilters = useCallback(() => {
    let results = [];
    
    // Rassembler tous les services actifs selon les filtres
    Object.keys(filters).forEach(type => {
      if (filters[type] && allServices[type]) {
        results = [...results, ...allServices[type]];
      }
    });
    
    // Appliquer la recherche par adresse si un terme est fourni
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      results = results.filter(service => 
        service.address && service.address.toLowerCase().includes(searchLower)
      );
    }
    
    setFilteredServices(results);
  }, [filters, searchTerm, allServices]);

  // Charger tous les services au montage du composant
  useEffect(() => {
    const loadAllServices = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const services = await fetchAllServices();
        console.log('Services chargés:', services);
        setAllServices(services);

        const filterParam = searchParams.get('filter');
        if (filterParam && ['association', 'petshop', 'veterinarian'].includes(filterParam)) {
          const newFilters = {
            veterinarian: false,
            association: false,
            petshop: false
          };
          // Activer seulement le filtre spécifié
          newFilters[filterParam] = true;
          setFilters(newFilters);
        }

      } catch (err) {
        setError(`Erreur lors du chargement des services: ${err.message}`);
        console.error('Erreur:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAllServices();
  }, [fetchAllServices, searchParams]);
  
  // Appliquer les filtres chaque fois que les filtres ou le terme de recherche changent
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);
  
  // Toggle filter state
  const toggleFilter = (filterType) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: !prev[filterType]
    }));
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    applyFilters();
  };
  
  // Get appropriate icon and style based on service type
  const getServiceIcon = (type) => {
    switch(type) {
      case 'veterinarian':
        return <VetIcon />;
      case 'association':
        return <AssociationIcon />;
      case 'petshop':
        return <PetShopIcon />;
      default:
        return null;
    }
  };
  
  const getCardClass = (type) => {
    let baseClass = styles.resultCard;
    switch(type) {
      case 'veterinarian':
        return `${baseClass} ${styles.vetCard}`;
      case 'association':
        return `${baseClass} ${styles.assocCard}`;
      case 'petshop':
        return `${baseClass} ${styles.shopCard}`;
      default:
        return baseClass;
    }
  };
  
  const getIconClass = (type) => {
    let baseClass = styles.resultIcon;
    switch(type) {
      case 'veterinarian':
        return `${baseClass} ${styles.vetIcon}`;
      case 'association':
        return `${baseClass} ${styles.assocIcon}`;
      case 'petshop':
        return `${baseClass} ${styles.shopIcon}`;
      default:
        return baseClass;
    }
  };
  
  const getFilterClass = (type) => {
    let baseClass;
    switch(type) {
      case 'veterinarian':
        baseClass = `${styles.filterButton} ${styles.vetFilter}`;
        break;
      case 'association':
        baseClass = `${styles.filterButton} ${styles.assocFilter}`;
        break;
      case 'petshop':
        baseClass = `${styles.filterButton} ${styles.shopFilter}`;
        break;
      default:
        baseClass = styles.filterButton;
    }
    
    return filters[type] ? `${baseClass} ${styles.active}` : baseClass;
  };

  // Fonction pour extraire la wilaya de l'adresse
  const extractWilayaFromAddress = (address) => {
    if (!address) return 'Non spécifié';
    
    // Chercher si une des wilayas est mentionnée dans l'adresse
    const foundWilaya = ALGERIA_WILAYAS.find(wilaya => 
      address.toLowerCase().includes(wilaya.toLowerCase())
    );
    
    return foundWilaya || 'Autre';
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Find Pet Services in Algeria</h1>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '200px',
          fontSize: '18px'
        }}>
          Chargement des services...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Find Pet Services in Algeria</h1>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '200px',
          color: '#ef4444'
        }}>
          <div style={{ marginBottom: '10px' }}>{error}</div>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Find Pet Services in Algeria</h1>
      <p className={styles.description}>
        Find veterinarians, animal associations, and pet shops across Algeria
      </p>
      
      <div className={styles.mainContent}>
        <div className={styles.sidebar}>
          <form onSubmit={handleSearchSubmit}>
            <div className={styles.searchBar}>
              <input
                type="text"
                placeholder="Search by address..."
                className={styles.searchInput}
                value={searchTerm}
                onChange={handleSearchChange}
                list="wilayasList"
              />
              <datalist id="wilayasList">
                {ALGERIA_WILAYAS.map((wilaya, index) => (
                  <option key={index} value={wilaya} />
                ))}
              </datalist>
              <button type="submit" className={styles.searchButton}>
                <SearchIcon />
              </button>
            </div>
          </form>
          
          <div className={styles.filtersContainer}>
            <button 
              className={getFilterClass('veterinarian')}
              onClick={() => toggleFilter('veterinarian')}
            >
              <VetIcon /> Veterinarians ({allServices.veterinarian.length})
            </button>
            <button 
              className={getFilterClass('association')}
              onClick={() => toggleFilter('association')}
            >
              <AssociationIcon /> Associations ({allServices.association.length})
            </button>
            <button 
              className={getFilterClass('petshop')}
              onClick={() => toggleFilter('petshop')}
            >
              <PetShopIcon /> Pet Shops ({allServices.petshop.length})
            </button>
          </div>
          
          <div className={styles.resultsList}>
            {filteredServices.length > 0 ? (
              filteredServices.map(service => (
                <div key={service.id} className={getCardClass(service.type)}>
                  <div className={getIconClass(service.type)}>
                    {getServiceIcon(service.type)}
                  </div>
                  <div className={styles.resultContent}>
                    <h3 className={styles.resultName}>{service.name}</h3>
                    <p className={styles.resultAddress}>
                      <LocationIcon /> {service.address || 'Adresse non spécifiée'}
                    </p>
                    <p className={styles.resultWilaya}>
                      <MapIcon /> {extractWilayaFromAddress(service.address)}
                    </p>
                    {service.phone && (
                      <p className={styles.resultPhone}>
                        📞 {service.phone}
                      </p>
                    )}
                    {service.description && (
                      <p className={styles.resultDescription}>
                        {service.description.substring(0, 100)}
                        {service.description.length > 100 ? '...' : ''}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.noResults}>
                <div className={styles.noResultsIcon}>🔍</div>
                <p>No services found matching your criteria</p>
                <p>Try adjusting your filters or search term</p>
              </div>
            )}
          </div>
        </div>
        
        <div className={styles.mapContainer}>
          <div className={styles.map}>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
              color: '#64748b',
              width: '80%'
            }}>
              <h3>Map of Algeria</h3>
              <p>Total Services: {filteredServices.length}</p>
              <div style={{ marginTop: '20px', fontSize: '14px' }}>
                <div>🏥 Veterinarians: {allServices.veterinarian.length}</div>
                <div>🤝 Associations: {allServices.association.length}</div>
                <div>🏪 Pet Shops: {allServices.petshop.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant de chargement pour Suspense
function ServiceLocatorLoading() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '60vh',
      textAlign: 'center'
    }}>
      <div style={{
        width: '50px',
        height: '50px',
        border: '3px solid #f3f3f3',
        borderTop: '3px solid #3498db',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '20px'
      }}></div>
      <h2 style={{ color: '#64748b', marginBottom: '10px' }}>
        Chargement du localisateur de services...
      </h2>
      <p style={{ color: '#94a3b8' }}>
        Récupération des services vétérinaires, associations et animaleries
      </p>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Page principale avec Suspense
export default function ServiceLocator() {
  return (
    <Suspense fallback={<ServiceLocatorLoading />}>
      <ServiceLocatorContent />
    </Suspense>
  );
}