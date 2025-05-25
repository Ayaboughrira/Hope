'use client'

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import styles from '../styles/favoritepets.module.css';
import Image from 'next/image';

const FavoritePets = () => {
  // État pour stocker les animaux favoris
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Session NextAuth
  const { data: session, status } = useSession();

  useEffect(() => {
    // Charger les favoris depuis l'API (authentifié)
    const loadFavorites = async () => {
      try {
        // Vérifier si l'utilisateur est connecté
        if (status === 'loading') {
          return; // Attendre que la session se charge
        }
        
        if (status === 'unauthenticated' || !session) {
          setFavorites([]);
          setLoading(false);
          return;
        }

        // Récupérer d'abord la liste des IDs favoris de l'utilisateur
        const favoritesResponse = await fetch('/api/favorites');
        
        if (!favoritesResponse.ok) {
          throw new Error(`HTTP error: ${favoritesResponse.status}`);
        }
        
        const { success: favsSuccess, data: favoriteIds } = await favoritesResponse.json();
        
        if (!favsSuccess || !favoriteIds || favoriteIds.length === 0) {
          setFavorites([]);
          setLoading(false);
          return;
        }
        
        // Récupérer les détails des animaux favoris
        const animalsResponse = await fetch(`/api/favorites?ids=${favoriteIds.join(',')}`);
        
        if (!animalsResponse.ok) {
          throw new Error(`HTTP error: ${animalsResponse.status}`);
        }
        
        const { success: animSuccess, data: animalsData } = await animalsResponse.json();
        
        if (animSuccess) {
          // Transformer les données pour correspondre au format attendu dans l'UI
          const formattedData = animalsData.map(animal => {
            // Gestion de l'image
            let imageUrl = '/placeholder-animal.jpg';
            if (animal.photos && animal.photos.length > 0) {
              if (typeof animal.photos[0] === 'string') {
                imageUrl = animal.photos[0];
              } else if (animal.photos[0].url) {
                imageUrl = animal.photos[0].url;
              }
            }

            // Récupération du nom de l'espèce
            const speciesName = animal.speciesDetails?.name || 
                              animal.speciesDetails?.code || 
                              animal.animalType || 
                              animal.species || 
                              'Inconnu';

            // Récupération du nom de la race
            const raceName = animal.raceDetails?.name || 
                           animal.raceCode || 
                           animal.race || 
                           '';

            return {
              id: animal._id,
              name: animal.animalName || animal.name || 'Sans nom',
              species: speciesName,
              race: raceName,
              gender: animal.gender || 'Inconnu',
              age: animal.age || 'Inconnu',
              size: animal.size || 'Inconnu',
              description: animal.description || 'No description available',
              image: imageUrl
            };
          });
          
          setFavorites(formattedData);
        } else {
          throw new Error('Échec de la récupération des animaux favoris');
        }
      } catch (error) {
        console.error("Erreur lors du chargement des favoris:", error);
        setError("Impossible de charger vos animaux favoris. Veuillez réessayer plus tard.");
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [session, status]);

  // Fonction pour retirer un animal des favoris
  const removeFromFavorites = async (animalId) => {
    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          animalId: animalId,
          action: 'remove'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const { success, message } = await response.json();
      
      if (success) {
        // Mettre à jour l'état local pour supprimer cet animal
        setFavorites(prevFavorites => 
          prevFavorites.filter(animal => animal.id !== animalId)
        );
        
        console.log(message);
      } else {
        throw new Error(message || 'Erreur lors de la suppression');
      }
    } catch (error) {
      console.error("Erreur lors de la suppression des favoris:", error);
      setError("Impossible de supprimer cet animal des favoris. Veuillez réessayer.");
    }
  };

  // Affichage conditionnel basé sur l'état de la session
  if (status === 'loading') {
    return (
      <div className={styles.favoritesContainer}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className={styles.favoritesContainer}>
        <div className={styles.emptyState}>
          <div className={styles.emptyStateContent}>
            <h2 className={styles.emptyStateTitle}>You must be logged in</h2>
            <p className={styles.emptyStateDescription}>
              Log in to see your favorite animals and add new ones.
            </p>
            <Link href="/signuplogin" className={styles.viewCatalogBtn}>
              sign up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.favoritesContainer}>
      <h1 className={styles.favoritesTitle}>My favorites animals</h1>
      
      {loading ? (
        <div className={styles.loading}>Loading...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : favorites.length > 0 ? (
        <div className={styles.favoritesGrid}>
          {favorites.map(animal => (
            <div key={animal.id} className={styles.favoriteCard}>
              <div className={styles.cardImageContainer}>
                <Image 
                  src={animal.image} 
                  alt={animal.name} 
                  className={styles.cardImage}
                  width={300}
                  height={200}
                  onError={(e) => {
                    e.target.src = '/placeholder-animal.jpg';
                  }}
                />
                <button 
                  className={styles.favoriteBtn}
                  onClick={() => removeFromFavorites(animal.id)}
                  aria-label="Remove from favorites"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="red" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
              <div className={styles.cardContent}>
                <h3 className={styles.animalName}>{animal.name}</h3>
                <div className={styles.infoRow}>
                  <p><strong>Species:</strong> {animal.species}</p>
                  <p className={styles.gender}>
                    <strong>Gender:</strong> 
                    <span className={styles.genderIcon}>
                      {(animal.gender?.toLowerCase() === 'male' || animal.gender?.toLowerCase() === 'mâle') ? (
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
                  </p>
                </div>
                <p><strong>Age:</strong> {animal.age} {animal.age === '1' ? 'year' : 'years' }</p>
                {animal.race && <p><strong>Race:</strong> {animal.race}</p>}
                <p className={styles.animalDescription}>
                  {animal.description.length > 100 
                    ? `${animal.description.substring(0, 100)}...` 
                    : animal.description
                  }
                </p>
                <Link href={`/catalogueanimal/${animal.id}`} className={styles.viewDetailsBtn}>
                 View details
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateContent}>
            <h2 className={styles.emptyStateTitle}>Your favorites list is empty.</h2>
            <p className={styles.emptyStateDescription}>
              Browse our catalog of animals you love !
            </p>
            <Link href="/catalogueanimal" className={styles.viewCatalogBtn}>
              View catalog
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default FavoritePets;