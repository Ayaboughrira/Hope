// pages/catalog.js
'use client'

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Search, Filter, ChevronDown, Tag, DollarSign, MapPin, X, Store } from 'lucide-react';
import Link from 'next/link';
import styles from '../styles/catalogueproduit.module.css';
import productsData from './produit.json';
import { db } from '../config/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';


const ProductCatalog = () => {
  // State for products and filters
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 200 });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [animaleries, setAnimaleries] = useState({});
  
  // State for modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Regular expressions for validation
  const priceRegex = /^[0-9]+(\.[0-9]{1,2})?$/;
  const discountRegex = /^([0-9]|[1-9][0-9]|100)$/;

  // Validate a product
  const validateProduct = (product) => {
    const errors = {};
    
    // Validate price
    if (!product.price) {
      errors.price = 'Price is required';
    } else if (!priceRegex.test(String(product.price))) {
      errors.price = 'Price must be a positive number with up to 2 decimal places';
    }
    
    // Validate discount
    if (product.discount !== undefined && product.discount !== null) {
      if (!discountRegex.test(String(product.discount))) {
        errors.discount = 'Discount must be a whole number between 0 and 100';
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };

  // Load products from JSON and animaleries from Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        // First validate products from JSON
        const validProducts = productsData.filter(product => {
          const validation = validateProduct(product);
          if (!validation.isValid) {
            console.error(`Invalid product data for ${product.name}:`, validation.errors);
            setValidationErrors(prev => ({
              ...prev,
              [product.id]: validation.errors
            }));
            return false;
          }
          return true;
        });

        // Fetch animaleries data from Firebase
        const animalerieCollection = collection(db, 'animaleries');
        const animalerieSnapshot = await getDocs(animalerieCollection);
        const animalerieData = {};
        
        animalerieSnapshot.forEach(doc => {
          const data = doc.data();
          animalerieData[doc.id] = data;
        });
        
        setAnimaleries(animalerieData);
        
        // Match products with animaleries based on animalerieId field
        const productsWithAnimaleries = validProducts.map(product => {
          // If the product has an animalerieId, find the matching animalerie
          if (product.animalerieId && animalerieData[product.animalerieId]) {
            return {
              ...product,
              animalerie: animalerieData[product.animalerieId]
            };
          }
          return product;
        });
        
        setProducts(productsWithAnimaleries);
        setFilteredProducts(productsWithAnimaleries);
        
        // Set initial price range based on products
        if (validProducts.length > 0) {
          const prices = validProducts.map(product => product.price);
          const minPrice = Math.floor(Math.min(...prices));
          const maxPrice = Math.ceil(Math.max(...prices));
          setPriceRange({ min: minPrice, max: maxPrice });
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    
    fetchData();
  }, []);

  // Apply filters when price range or search term changes
  useEffect(() => {
    let result = products;

    // Filter by price range
    result = result.filter(
      product => product.price >= priceRange.min && product.price <= priceRange.max
    );

    // Filter by search term
    if (searchTerm) {
      result = result.filter(
        product =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (product.animalerie && product.animalerie.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    setFilteredProducts(result);
  }, [priceRange, searchTerm, products]);

  // Handle price range input changes
  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    setPriceRange(prev => ({ ...prev, [name]: Number(value) }));
  };

  // Calculate final price with discount
  const calculateFinalPrice = (price, discount) => {
    if (!discount) return price.toFixed(2);
    return (price - (price * discount / 100)).toFixed(2);
  };
  
  // Handle opening the modal when a product card is clicked
  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setModalOpen(true);
    document.body.classList.add(styles.bodyNoScroll);
  };
  
  // Handle closing the modal
  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedProduct(null);
    document.body.classList.remove(styles.bodyNoScroll);
  };
  
  // Stop event propagation to prevent modal closing when clicking inside the modal content
  const handleModalContentClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Pet Shop Product Catalog</h1>
        <p className={styles.subtitle}>Find the perfect products for your pets</p>
      </header>

      <div className={styles.searchAndFilter}>
        <div className={styles.searchContainer}>
          <Search className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search products or pet shops..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <button 
          className={styles.filterToggle} 
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className={styles.filterIcon} />
          Filters
          <ChevronDown className={styles.chevronIcon} />
        </button>
      </div>

      {showFilters && (
        <div className={styles.filterPanel}>
          <h3 className={styles.filterTitle}>Price Range</h3>
          <div className={styles.priceInputs}>
            <div className={styles.priceField}>
              <label htmlFor="min">Min ($):</label>
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
              <label htmlFor="max">Max ($):</label>
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
        </div>
      )}

      <main className={styles.productList}>
        {filteredProducts.length === 0 ? (
          <div className={styles.noProducts}>
            <p>No products found matching your criteria.</p>
          </div>
        ) : (
          filteredProducts.map(product => (
            <div 
              key={product.id} 
              className={styles.productCard}
              onClick={() => handleProductClick(product)}
            >
              <div className={styles.productImage}>
                <Image
                  src={product.image || "/api/placeholder/150/150"}
                  alt={product.name}
                  width={150}
                  height={150}
                  className={styles.image}
                />
                {product.discount > 0 && (
                  <div className={styles.discountBadge}>
                    <Tag className={styles.tagIcon} />
                    {product.discount}% OFF
                  </div>
                )}
              </div>
              
              <div className={styles.productInfo}>
                <h2 className={styles.productName}>{product.name}</h2>
                
                {product.animalerie && (
                  <div className={styles.animalerieTag}>
                    <Store className={styles.storeIcon} />
                    <span>{product.animalerie.name}</span>
                  </div>
                )}
                
                <div className={styles.priceContainer}>
                  {product.discount > 0 ? (
                    <>
                      <span className={styles.originalPrice}>${product.price.toFixed(2)}</span>
                      <span className={styles.finalPrice}>
                        <DollarSign className={styles.dollarIcon} />
                        {calculateFinalPrice(product.price, product.discount)}
                      </span>
                    </>
                  ) : (
                    <span className={styles.finalPrice}>
                      <DollarSign className={styles.dollarIcon} />
                      {product.price.toFixed(2)}
                    </span>
                  )}
                </div>
                
                <p className={styles.productDescription}>{product.description}</p>
                
              </div>
            </div>
          ))
        )}
      </main>

      {/* Modal for displaying product details */}
      {modalOpen && selectedProduct && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modalContent} onClick={handleModalContentClick}>
            <button className={styles.modalCloseButton} onClick={handleCloseModal}>
              <X />
            </button>
            
            <div className={styles.modalProductDetails}>
              <div className={styles.modalProductImage}>
                <Image
                  src={selectedProduct.image || "/api/placeholder/300/300"}
                  alt={selectedProduct.name}
                  width={300}
                  height={300}
                  className={styles.modalImage}
                />
                {selectedProduct.discount > 0 && (
                  <div className={styles.modalDiscountBadge}>
                    <Tag className={styles.tagIcon} />
                    {selectedProduct.discount}% OFF
                  </div>
                )}
              </div>
              
              <div className={styles.modalProductInfo}>
                <h2 className={styles.modalProductName}>{selectedProduct.name}</h2>
                
                {selectedProduct.animalerie && (
                  <Link 
                    href={`/animalerie/${selectedProduct.animalerieId}`}
                    className={styles.modalAnimalerieLink}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className={styles.modalAnimalerieInfo}>
                      <Store className={styles.modalStoreIcon} />
                      <div className={styles.modalAnimalerieDetails}>
                        <span className={styles.modalAnimalerieName}>{selectedProduct.animalerie.name}</span>
                        {selectedProduct.animalerie.address && (
                          <span className={styles.modalAnimalerieAddress}>
                            <MapPin className={styles.pinIcon} />
                            {selectedProduct.animalerie.address}
                          </span>
                        )}
                        <span className={styles.viewProfileLink}>View Pet Shop Profile</span>
                      </div>
                    </div>
                  </Link>
                )}
                
                <div className={styles.modalPriceContainer}>
                  {selectedProduct.discount > 0 ? (
                    <>
                      <span className={styles.modalOriginalPrice}>${selectedProduct.price.toFixed(2)}</span>
                      <span className={styles.modalFinalPrice}>
                        <DollarSign className={styles.dollarIcon} />
                        {calculateFinalPrice(selectedProduct.price, selectedProduct.discount)}
                      </span>
                    </>
                  ) : (
                    <span className={styles.modalFinalPrice}>
                      <DollarSign className={styles.dollarIcon} />
                      {selectedProduct.price.toFixed(2)}
                    </span>
                  )}
                </div>
                
                <p className={styles.modalProductDescription}>{selectedProduct.description}</p>
                
                {selectedProduct.features && (
                  <div className={styles.modalProductFeatures}>
                    <h3>Features</h3>
                    <ul>
                      {selectedProduct.features.map((feature, index) => (
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

      {Object.keys(validationErrors).length > 0 && (
        <div className={styles.validationErrorContainer}>
          <h3>Data Validation Errors:</h3>
          <ul>
            {Object.entries(validationErrors).map(([id, errors]) => (
              <li key={id}>
                Product ID {id}:
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
    </div>
  );
};

export default ProductCatalog;