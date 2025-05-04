'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Search, Filter, ChevronDown, Tag, DollarSign, MapPin, X, Store } from 'lucide-react';
import Link from 'next/link';
import styles from '../styles/catalogueproduit.module.css';

export default function ProductCatalog() {
  // State pour les produits et les filtres
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 200 });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [animaleries, setAnimaleries] = useState({});
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

  // Chargement des produits depuis l'API MongoDB
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        console.log('Récupération des produits...');
        
        // Récupération des produits depuis notre API - Utilisation des filtres get si nécessaire
        const productResponse = await fetch(`/api/produits?page=1&limit=20&minPrice=${priceRange.min}&maxPrice=${priceRange.max}${searchTerm ? `&search=${searchTerm}` : ''}`);
        
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
          promotion: parseFloat(product.promotion || 0)
        }));
        
        console.log('Produits normalisés:', normalizedProducts.length);
        
        try {
          // Récupération des animaleries depuis notre API
          const animalerieResponse = await fetch('/api/animaleries');
          if (!animalerieResponse.ok) {
            console.warn('Erreur lors de la récupération des animaleries:', animalerieResponse.status);
            // Continuer sans les animaleries
            setProducts(normalizedProducts);
            setFilteredProducts(normalizedProducts);
            setLoading(false);
            return;
          }
          
          const animalerieResponseData = await animalerieResponse.json();
          
          // Extraire les données d'animaleries selon le format de réponse standardisé
          const animalerieData = animalerieResponseData.data || animalerieResponseData || [];
          
          // Création d'une map des animaleries par ID pour une recherche plus facile
          const animalerieMap = {};
          animalerieData.forEach(animalerie => {
            animalerieMap[animalerie._id] = animalerie;
          });
          
          setAnimaleries(animalerieMap);
          
          // Association des produits avec les animaleries
          const productsWithAnimaleries = normalizedProducts.map(product => {
            // Vérifier si le produit a déjà une animalerie associée
            if (product.animalerie) {
              return product;
            }
            
            // Si le produit a un animalerieId, trouver l'animalerie correspondante
            if (product.animalerieId && animalerieMap[product.animalerieId]) {
              return {
                ...product,
                animalerie: animalerieMap[product.animalerieId]
              };
            }
            return product;
          });
          
          setProducts(productsWithAnimaleries);
          setFilteredProducts(productsWithAnimaleries);
        } catch (animalerieError) {
          console.warn('Erreur animaleries:', animalerieError);
          // Continuer avec seulement les produits normalisés
          setProducts(normalizedProducts);
          setFilteredProducts(normalizedProducts);
        }
        
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
        promotion: parseFloat(product.promotion || 0)
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
        <h1 className={styles.title}>Catalogue de Produits Animalerie</h1>
        <p className={styles.subtitle}>Trouvez les produits parfaits pour vos animaux de compagnie</p>
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
                onClick={() => console.log('État actuel:', { products, filteredProducts, priceRange, searchTerm, debugInfo })}
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
                  {/*
                  {product.animalerie && (
                    <div className={styles.animalerieTag}>
                      <Store className={styles.storeIcon} />
                      <span>{product.animalerie.nom}</span>
                    </div>
                  )}
                  */}
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
                {/*
                {selectedProduct.animalerie && (
                  <Link 
                    href={`/animalerie/${selectedProduct.animalerieId}`}
                    className={styles.modalAnimalerieLink}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className={styles.modalAnimalerieInfo}>
                      <Store className={styles.modalStoreIcon} />
                      <div className={styles.modalAnimalerieDetails}>
                        <span className={styles.modalAnimalerieName}>{selectedProduct.animalerie.nom}</span>
                        {selectedProduct.animalerie.adresse && (
                          <span className={styles.modalAnimalerieAddress}>
                            <MapPin className={styles.pinIcon} />
                            {selectedProduct.animalerie.adresse}
                          </span>
                        )}
                        <span className={styles.viewProfileLink}>Voir le profil de l'animalerie</span>
                      </div>
                    </div>
                  </Link>
                )}*/}
                
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
          onClick={() => console.log('État actuel:', { products, filteredProducts, debugInfo })}
        >
          Debug
        </button>
      </div>
    </div>
  );
}