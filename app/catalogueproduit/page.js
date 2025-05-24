'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Search, Filter, ChevronDown, Tag, DollarSign, MapPin, X, Store, Plus, User } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import styles from '../styles/catalogueproduit.module.css';

export default function ProductCatalog() {
  const { data: session, status } = useSession();
  
  // State pour les produits et les filtres
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 200 });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTypeId, setSelectedTypeId] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [animaleries, setAnimaleries] = useState({});
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);
  
  // State pour la modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Validation d'un produit
  const validateProduct = (product) => {
    const errors = {};
    
    // Validation du prix - Accepter à la fois price et prix
    const productPrice = product.price !== undefined ? product.price : product.prix;
    if (productPrice === undefined) {
      errors.price = 'Prix est requis';
    } else if (isNaN(parseFloat(productPrice))) {
      errors.price = 'Le prix doit être un nombre';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  // Chargement des types depuis l'API
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        console.log('Récupération des types...');
        const response = await fetch('/api/type');
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Réponse API types:', data);
        
        if (data.success) {
          setTypes(data.data || []);
          console.log('Types chargés:', data.data);
        } else {
          console.error('Erreur lors du chargement des types:', data.message);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des types:', error);
      }
    };

    fetchTypes();
  }, []);

  // Chargement des produits depuis l'API MongoDB
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        console.log('Récupération des produits...');
        
        // Construction des paramètres de requête
        const params = new URLSearchParams({
          page: 1,
          limit: 20,
          minPrice: priceRange.min,
          maxPrice: priceRange.max
        });
        
        if (searchTerm) {
          params.append('search', searchTerm);
        }
        
        if (selectedTypeId) {
          params.append('typeId', selectedTypeId);
        }
        
        // Récupération des produits depuis notre API
        const productResponse = await fetch(`/api/produits?${params.toString()}`);
        
        if (!productResponse.ok) {
          throw new Error(`Erreur lors de la récupération des produits: ${productResponse.status}`);
        }
        
        const responseData = await productResponse.json();
        console.log('Réponse complète de l\'API:', responseData);
        setDebugInfo(responseData);
        
        // Extraire les données en fonction du format standardisé
        if (!responseData.success) {
          console.error('Erreur API:', responseData.message);
          setLoading(false);
          return;
        }
        
        const productData = responseData.data || [];
        
        // Définir la pagination si disponible
        if (responseData.pagination) {
          setPagination(responseData.pagination);
        }
        
        console.log('Produits extraits:', productData);
        
        if (productData.length === 0) {
          console.warn('Aucun produit retourné par l\'API');
          setProducts([]);
          setFilteredProducts([]);
          setLoading(false);
          return;
        }
        
        // Validation des produits
        const validProducts = productData.filter(product => {
          const validation = validateProduct(product);
          if (!validation.isValid) {
            console.error(`Données de produit invalides pour ${product.label || product.libelle || product._id}:`, validation.errors);
            setValidationErrors(prev => ({
              ...prev,
              [product._id]: validation.errors
            }));
            return false;
          }
          return true;
        });
        
        console.log('Produits valides:', validProducts.length);
        
        // Créer une liste de produits normalisés pour assurer la cohérence des champs
        const normalizedProducts = validProducts.map(product => ({
          ...product,
          // Normaliser les champs pour la cohérence
          label: product.label || product.libelle || '',
          price: parseFloat(product.price || product.prix || 0),
          description: product.description || product.descriptionProduit || '',
          image: product.photosProduit || product.image || '',
          promotion: parseFloat(product.promotion || 0),
          // Informations sur le type
          typeName: product.typeName || 'Non spécifié',
          typeDescription: product.typeDescription || '',
          // Informations sur l'animalerie
          animalrieName: product.animalrieName || 'Non spécifié',
          animalrieEmail: product.animalrieEmail || '',
          animalrieAdresse: product.animalrieAdresse || ''
        }));
        
        console.log('Produits normalisés:', normalizedProducts.length);
        
        setProducts(normalizedProducts);
        setFilteredProducts(normalizedProducts);
        
        // Définition de la fourchette de prix initiale en fonction des produits
        if (normalizedProducts.length > 0) {
          const prices = normalizedProducts.map(product => parseFloat(product.price || 0));
          const minPrice = Math.floor(Math.min(...prices));
          const maxPrice = Math.ceil(Math.max(...prices));
          setPriceRange({ min: minPrice, max: maxPrice });
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des données:", error);
        setDebugInfo({error: error.message});
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []); // Dépendances vides pour l'appel initial

  // Recherche avec filtres côté API
  const handleSearch = async () => {
    try {
      setLoading(true);
      
      // Construction des paramètres de requête
      const params = new URLSearchParams({
        page: 1,
        limit: 20,
        minPrice: priceRange.min,
        maxPrice: priceRange.max
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      if (selectedTypeId) {
        params.append('typeId', selectedTypeId);
      }
      
      // Appel API avec filtres
      const response = await fetch(`/api/produits?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Erreur de recherche: ${response.status}`);
      }
      
      const data = await response.json();
      setDebugInfo(data);
      
      if (!data.success) {
        console.error('Erreur API:', data.message);
        return;
      }
      
      const productData = data.data || [];
      
      // Validation et normalisation des produits
      const validProducts = productData.filter(product => {
        const validation = validateProduct(product);
        return validation.isValid;
      }).map(product => ({
        ...product,
        // Normaliser les champs pour la cohérence
        label: product.label || product.libelle || '',
        price: parseFloat(product.price || product.prix || 0),
        description: product.description || product.descriptionProduit || '',
        image: product.photosProduit || product.image || '',
        promotion: parseFloat(product.promotion || 0),
        // Informations sur le type
        typeName: product.typeName || 'Non spécifié',
        typeDescription: product.typeDescription || '',
        // Informations sur l'animalerie
        animalrieName: product.animalrieName || 'Non spécifié',
        animalrieEmail: product.animalrieEmail || '',
        animalrieAdresse: product.animalrieAdresse || ''
      }));
      
      // Mise à jour de la pagination
      if (data.pagination) {
        setPagination(data.pagination);
      }
      
      // Mettre à jour les produits avec les résultats filtrés
      setProducts(validProducts);
      setFilteredProducts(validProducts);
      
    } catch (error) {
      console.error("Erreur lors de la recherche:", error);
      setDebugInfo({error: error.message});
    } finally {
      setLoading(false);
    }
  };

  // Gestion des changements de saisie de la fourchette de prix
  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    setPriceRange(prev => ({ ...prev, [name]: Number(value) }));
  };

  // Gestion du changement de type
  const handleTypeChange = (e) => {
    setSelectedTypeId(e.target.value);
  };

  // Calcul du prix final avec réduction
  const calculateFinalPrice = (price, discount) => {
    if (!discount) return parseFloat(price).toFixed(2);
    return (parseFloat(price) - (parseFloat(price) * discount / 100)).toFixed(2);
  };
  
  // Gestion de l'ouverture de la modal lorsqu'une carte de produit est cliquée
  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setModalOpen(true);
    document.body.classList.add(styles.bodyNoScroll);
  };
  
  // Gestion de la fermeture de la modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedProduct(null);
    document.body.classList.remove(styles.bodyNoScroll);
  };
  
  // Arrêt de la propagation des événements pour éviter la fermeture de la modal lors d'un clic à l'intérieur du contenu
  const handleModalContentClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.titleSection}>
            <h1 className={styles.title}>Catalogue de Produits Animalerie</h1>
            <p className={styles.subtitle}>Trouvez les produits parfaits pour vos animaux de compagnie</p>
          </div>
          
          <div className={styles.userSection}>
            {status === 'loading' ? (
              <div className={styles.userLoading}>Chargement...</div>
            ) : session ? (
              <div className={styles.userInfo}>
                <User className={styles.userIcon} />
                <span className={styles.userName}>
                  {session.user?.name || session.user?.email}
                </span>
                <Link href="/announcer-produit" className={styles.addProductBtn}>
                  <Plus className={styles.plusIcon} />
                  Ajouter un produit
                </Link>
              </div>
            ) : (
              <Link href="/signuplogin" className={styles.loginBtn}>
                Se connecter
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className={styles.searchAndFilter}>
        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Rechercher des produits ou animaleries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>

        <button 
          className={styles.filterToggle} 
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className={styles.filterIcon} />
          Filtres
          <ChevronDown className={styles.chevronIcon} />
        </button>
      </div>

      {showFilters && (
        <div className={styles.filterPanel}>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <h3 className={styles.filterTitle}>Type de produit</h3>
              <select
                value={selectedTypeId}
                onChange={handleTypeChange}
                className={styles.typeSelect}
              >
                <option value="">Tous les types</option>
                {types.map(type => (
                  <option key={type._id} value={type._id}>
                    {type.nomType}
                  </option>
                ))}
              </select>
            </div>
            
            <div className={styles.filterGroup}>
              <h3 className={styles.filterTitle}>Fourchette de Prix</h3>
              <div className={styles.priceInputs}>
                <div className={styles.priceField}>
                  <label htmlFor="min">Min (€):</label>
                  <input
                    type="number"
                    id="min"
                    name="min"
                    min="0"
                    max={priceRange.max}
                    value={priceRange.min}
                    onChange={handlePriceChange}
                    className={styles.priceInput}
                  />
                </div>
                <div className={styles.priceField}>
                  <label htmlFor="max">Max (€):</label>
                  <input
                    type="number"
                    id="max"
                    name="max"
                    min={priceRange.min}
                    value={priceRange.max}
                    onChange={handlePriceChange}
                    className={styles.priceInput}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className={styles.priceSlider}>
            <input
              type="range"
              min="0"
              max={Math.max(200, priceRange.max)}
              value={priceRange.min}
              onChange={(e) => setPriceRange(prev => ({ ...prev, min: Number(e.target.value) }))}
              className={styles.slider}
            />
            <input
              type="range"
              min="0"
              max={Math.max(200, priceRange.max)}
              value={priceRange.max}
              onChange={(e) => setPriceRange(prev => ({ ...prev, max: Number(e.target.value) }))}
              className={styles.slider}
            />
          </div>
          
          <button 
            className={styles.applyFiltersButton} 
            onClick={handleSearch}
          >
            Appliquer les filtres
          </button>
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>
          <p>Chargement des produits...</p>
        </div>
      ) : (
        <main className={styles.productList}>
          {filteredProducts.length === 0 ? (
            <div className={styles.noProducts}>
              <p>Aucun produit trouvé correspondant à vos critères.</p>
              <button 
                className={styles.debugButton}
                onClick={() => console.log('État actuel:', { products, filteredProducts, priceRange, searchTerm, selectedTypeId, debugInfo })}
              >
                Afficher les détails de débogage (console)
              </button>
            </div>
          ) : (
            filteredProducts.map(product => (
              <div 
                key={product._id} 
                className={styles.productCard}
                onClick={() => handleProductClick(product)}
              >
                <div className={styles.productImage}>
                  {product.image ? (
                    <Image
                      src={product.image}
                      alt={product.label || "Produit"}
                      width={150}
                      height={150}
                      className={styles.image}
                      onError={(e) => {
                        e.target.src = "/api/placeholder/150/150";
                      }}
                    />
                  ) : (
                    <Image
                      src="/api/placeholder/150/150"
                      alt={product.label || "Produit"}
                      width={150}
                      height={150}
                      className={styles.image}
                    />
                  )}
                  
                  {product.promotion > 0 && (
                    <div className={styles.discountBadge}>
                      <Tag className={styles.tagIcon} />
                      {product.promotion}% OFF
                    </div>
                  )}
                </div>
                
                <div className={styles.productInfo}>
                  <h2 className={styles.productName}>{product.label}</h2>
                  
                  {product.typeName && product.typeName !== 'Non spécifié' && (
                    <div className={styles.typeTag}>
                      <span className={styles.typeLabel}>{product.typeName}</span>
                    </div>
                  )}
                  
                  {product.animalrieName && product.animalrieName !== 'Non spécifié' && (
                    <div className={styles.animalerieTag}>
                      <Store className={styles.storeIcon} />
                      <span>{product.animalrieName}</span>
                    </div>
                  )}
                  
                  <div className={styles.priceContainer}>
                    {product.promotion > 0 ? (
                      <>
                        <span className={styles.originalPrice}>{parseFloat(product.price).toFixed(2)} €</span>
                        <span className={styles.finalPrice}>
                          {calculateFinalPrice(product.price, product.promotion)} €
                        </span>
                      </>
                    ) : (
                      <span className={styles.finalPrice}>
                        {parseFloat(product.price).toFixed(2)} €
                      </span>
                    )}
                  </div>
                  
                  <p className={styles.productDescription}>
                    {product.description || ""}
                  </p>
                </div>
              </div>
            ))
          )}
        </main>
      )}

      {/* Modal pour afficher les détails du produit */}
      {modalOpen && selectedProduct && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalContent} onClick={handleModalContentClick}>
            <button className={styles.modalCloseButton} onClick={handleCloseModal}>
              <X />
            </button>
            
            <div className={styles.modalProductDetails}>
              <div className={styles.modalProductImage}>
                {selectedProduct.image ? (
                  <Image
                    src={selectedProduct.image}
                    alt={selectedProduct.label || "Produit"}
                    width={300}
                    height={300}
                    className={styles.modalImage}
                    onError={(e) => {
                      e.target.src = "/api/placeholder/300/300";
                    }}
                  />
                ) : (
                  <Image
                    src="/api/placeholder/300/300"
                    alt={selectedProduct.label || "Produit"}
                    width={300}
                    height={300}
                    className={styles.modalImage}
                  />
                )}
                
                {selectedProduct.promotion > 0 && (
                  <div className={styles.modalDiscountBadge}>
                    <Tag className={styles.tagIcon} />
                    {selectedProduct.promotion}% OFF
                  </div>
                )}
              </div>
              
              <div className={styles.modalProductInfo}>
                <h2 className={styles.modalProductName}>{selectedProduct.label}</h2>
                
                {selectedProduct.typeName && selectedProduct.typeName !== 'Non spécifié' && (
                  <div className={styles.modalTypeInfo}>
                    <span className={styles.modalTypeLabel}>Type: {selectedProduct.typeName}</span>
                    {selectedProduct.typeDescription && (
                      <p className={styles.modalTypeDescription}>{selectedProduct.typeDescription}</p>
                    )}
                  </div>
                )}
                
                {selectedProduct.animalrieName && selectedProduct.animalrieName !== 'Non spécifié' && (
                  <div className={styles.modalAnimalerieInfo}>
                    <Store className={styles.modalStoreIcon} />
                    <div className={styles.modalAnimalerieDetails}>
                      <span className={styles.modalAnimalerieName}>{selectedProduct.animalrieName}</span>
                      {selectedProduct.animalrieAdresse && (
                        <span className={styles.modalAnimalerieAddress}>
                          <MapPin className={styles.pinIcon} />
                          {selectedProduct.animalrieAdresse}
                        </span>
                      )}
                      {selectedProduct.animalrieEmail && (
                        <span className={styles.modalAnimalerieEmail}>
                          Email: {selectedProduct.animalrieEmail}
                        </span>
                      )}
                    </div>
                  </div>
                )}
                
                <div className={styles.modalPriceContainer}>
                  {selectedProduct.promotion > 0 ? (
                    <>
                      <span className={styles.modalOriginalPrice}>
                        {parseFloat(selectedProduct.price).toFixed(2)} €
                      </span>
                      <span className={styles.modalFinalPrice}>
                        {calculateFinalPrice(selectedProduct.price, selectedProduct.promotion)} €
                      </span>
                    </>
                  ) : (
                    <span className={styles.modalFinalPrice}>
                      {parseFloat(selectedProduct.price).toFixed(2)} €
                    </span>
                  )}
                </div>
                
                <p className={styles.modalProductDescription}>
                  {selectedProduct.description || ""}
                </p>
                
                {selectedProduct.caracteristiques && selectedProduct.caracteristiques.length > 0 && (
                  <div className={styles.modalProductFeatures}>
                    <h3>Caractéristiques</h3>
                    <ul>
                      {selectedProduct.caracteristiques.map((feature, index) => (
                        <li key={index}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {pagination && (
        <div className={styles.paginationInfo}>
          <p>Page {pagination.page} sur {pagination.totalPages} ({pagination.totalItems} produits au total)</p>
        </div>
      )}

      {Object.keys(validationErrors).length > 0 && (
        <div className={styles.validationErrorContainer}>
          <h3>Erreurs de validation des données :</h3>
          <ul>
            {Object.entries(validationErrors).map(([id, errors]) => (
              <li key={id}>
                Produit ID {id}:
                <ul>
                  {Object.entries(errors).map(([field, message]) => (
                    <li key={field}>{field}: {message}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Bouton de debug pour afficher la réponse de l'API */}
      <div className={styles.debugSection}>
        <button 
          className={styles.debugButton}
          onClick={() => console.log('État actuel:', { products, filteredProducts, types, debugInfo, session })}
        >
          Debug
        </button>
      </div>
    </div>
  );
}