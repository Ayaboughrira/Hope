'use client'
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import animalData from '../animal.json'; 
import styles from '../../styles/animaldetail.module.css';

const AnimalDetail = () => {
  const router = useRouter();
  const params = useParams();
  const id = params.animalid;
  
  const [animal, setAnimal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    // Vérifier si l'ID est disponible (important pour le SSR)
    if (!id) return;

    const fetchAnimalData = async () => {
      try {
        // Simulation d'un chargement
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Trouver l'animal correspondant à l'ID
        const foundAnimal = animalData.find(animal => animal.id === parseInt(id) || animal.id === id);
        
        if (foundAnimal) {
          // Limiter à 5 images maximum
          if (foundAnimal.images && foundAnimal.images.length > 5) {
            foundAnimal.images = foundAnimal.images.slice(0, 5);
          }
          
          setAnimal(foundAnimal);
          
          // Vérifier si l'animal est dans les favoris (stockés dans localStorage)
          if (typeof window !== 'undefined') {
            const storedFavorites = localStorage.getItem('animalFavorites');
            if (storedFavorites) {
              const favoritesObj = JSON.parse(storedFavorites);
              setIsFavorite(!!favoritesObj[id]);
            }
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        setLoading(false);
      }
    };

    fetchAnimalData();
  }, [id]);

  const toggleFavorite = () => {
    if (!animal) return;
    
    // Récupérer les favoris actuels
    const storedFavorites = localStorage.getItem('animalFavorites') || '{}';
    const favorites = JSON.parse(storedFavorites);
    
    // Inverser l'état du favori pour cet animal
    const newFavoriteState = !isFavorite;
    favorites[animal.id] = newFavoriteState;
    
    // Sauvegarder les favoris mis à jour
    localStorage.setItem('animalFavorites', JSON.stringify(favorites));
    setIsFavorite(newFavoriteState);
  };

  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
  };

  const handlePrevImage = () => {
    if (!animal || !animal.images.length) return;
    setSelectedImageIndex((prevIndex) => 
      prevIndex === 0 ? animal.images.length - 1 : prevIndex - 1
    );
  };

  const handleNextImage = () => {
    if (!animal || !animal.images.length) return;
    setSelectedImageIndex((prevIndex) => 
      prevIndex === animal.images.length - 1 ? 0 : prevIndex + 1
    );
  };

  if (loading) {
    return <div className={styles.loading}>Chargement des détails de l'animal...</div>;
  }

  
  return (
    <div className={styles.animalDetailContainer}>  
      <div className={styles.animalDetailCard}>
        <div className={styles.animalImageGallery}>
          <div className={styles.mainImageContainer}>
            <img 
              src={animal.images[selectedImageIndex]} 
              alt={`${animal.name} - Photo ${selectedImageIndex + 1}`} 
              className={styles.mainImage} 
            />
            
            {/* Navigation buttons */}
            <div className={styles.galleryNavigation}>
              <button 
                className={`${styles.navButton} ${styles.navButtonPrev}`}
                onClick={handlePrevImage}
                aria-label="Image précédente"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button 
                className={`${styles.navButton} ${styles.navButtonNext}`}
                onClick={handleNextImage}
                aria-label="Image suivante"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
            
            {/* Image counter */}
            <div className={styles.imageCounter}>
              {selectedImageIndex + 1} / {Math.min(animal.images.length, 5)}
            </div>
            
            <button 
              className={`${styles.favoriteBtn} ${isFavorite ? styles.active : ''}`}
              onClick={toggleFavorite}
              aria-label={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={isFavorite ? "red" : "none"} stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>
          
          <div className={styles.thumbnailsContainer}>
            {animal.images.slice(0, 5).map((img, index) => (
              <div
                key={index}
                className={`${styles.thumbnail} ${selectedImageIndex === index ? styles.activeThumbnail : ''}`}
                onClick={() => handleImageClick(index)}
              >
                <img 
                  src={img} 
                  alt={`${animal.name} - Miniature ${index + 1}`} 
                />
              </div>
            ))}
          </div>
        </div>
        
        <div className={styles.animalInfoContainer}>
          <h1 className={styles.animalName}>{animal.name}</h1>
          
          <div className={styles.animalDetailsGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Species:</span>
              <span className={styles.detailValue}>{animal.species}</span>
            </div>
            
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Gender:</span>
              <span className={styles.detailValue}>
                <span className={styles.genderIcon}>
                  {animal.gender === 'Male' ? (
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
                  {animal.gender}
                </span>
              </span>
            </div>
            
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Age:</span>
              <span className={styles.detailValue}>{animal.age} ans</span>
            </div>
            
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Size:</span>
              <span className={styles.detailValue}>{animal.size}</span>
            </div>
          </div>
          
          <div className={styles.animalDescription}>
            <h2>About {animal.name}</h2>
            <p>{animal.description}</p>
          </div>
          
          <div className={styles.adoptionSection}>
            <h2>Interested in adoption?</h2>
            <p>If you wish to adopt {animal.name} ,please contact me to organize a meeting</p>
            <button className={styles.contactButton}>contact</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimalDetail;