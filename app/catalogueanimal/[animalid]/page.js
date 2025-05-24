'use client'
import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import styles from '../../styles/animaldetail.module.css';

const AnimalDetail = () => {
  const router = useRouter();
  const params = useParams();
  const id = params.animalid;
  const { data: session, status } = useSession();
  
  const [animal, setAnimal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adoptionMessage, setAdoptionMessage] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Fonction pour obtenir le nom d'affichage d'une espèce
  const getSpeciesDisplayName = (code) => {
    const speciesMap = {
      'dog': 'Dog',
      'cat': 'Cat',
      'bird': ''
    };
    return speciesMap[code] || code;
  };

  useEffect(() => {
    // Vérifier si l'ID est disponible (important pour le SSR)
    if (!id) return;

    const fetchAnimalData = async () => {
      try {
        setLoading(true);
        
        // Appel à l'API pour récupérer les données de l'animal par son ID
        const response = await fetch(`/api/animals/${id}`);
        
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        
        const { success, data } = await response.json();
        
        if (success && data) {
          // Extraire les informations des relations d'espèce et de race
          const speciesName = data.speciesDetails?.name || 
                            getSpeciesDisplayName(data.speciesCode) || 
                            'Espèce inconnue';
          
          const raceName = data.raceDetails?.name || 
                          (data.raceCode ? data.raceCode.replace(/^[^_]+_/, '') : null);

          // Préparer les images pour l'affichage dans le carousel
          const images = []; 
          
          // Traiter les photos selon leur format (string ou objet avec URL)
          if (data.photos && data.photos.length > 0) {
            data.photos.forEach(photo => {
              if (typeof photo === 'string') {
                images.push(photo);
              } else if (photo.url) {
                images.push(photo.url);
              }
            });
          } else if (data.image) {
            // Fallback sur l'image principale si c'est tout ce qu'on a
            images.push(data.image);
          } 
          
          // Limiter à 5 images maximum
          const limitedImages = images.slice(0, 5);
          
          // Créer un objet animal avec les données formatées
          const formattedAnimal = {
            ...data,
            name: data.animalName || data.name,
            species: speciesName,
            race: raceName,
            speciesCode: data.speciesCode || data.speciesDetails?.code,
            images: limitedImages
          };
          
          setAnimal(formattedAnimal);
          
          // Vérifier si l'animal est dans les favoris (stockés dans localStorage)
          if (typeof window !== 'undefined') {
            const storedFavorites = localStorage.getItem('animalFavorites');
            if (storedFavorites) {
              const favoritesObj = JSON.parse(storedFavorites);
              setIsFavorite(!!favoritesObj[id]);
            }
          }
        } else {
          throw new Error('Animal non trouvé');
        }
      } catch (error) {
        console.error("Erreur lors du chargement des données:", error);
        setError(`Impossible de charger les détails de l'animal: ${error.message}`);
      } finally {
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
    favorites[id] = newFavoriteState;
    
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

  const handleContactOwner = () => {
    // Si l'utilisateur n'est pas connecté, le rediriger vers la page de connexion
    if (status !== 'authenticated') {
      router.push(`/signuplogin?callbackUrl=/animals/${id}`);
      return;
    }
    
    // Ouvrir une modal ou rediriger vers un formulaire d'adoption
    document.getElementById('adoptionModal').showModal();
  };

  const closeConfirmationModal = () => {
    setShowConfirmation(false);
  };

  const handleAdoptionRequest = async (e) => {
    e.preventDefault();
    
    if (!animal || !session) return;
    
    try {
      setIsSubmitting(true);
      
      const response = await fetch('/api/adoptiondemande', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          animalId: id,
          ownerId: animal.ownerId || animal.publishId,
          ownerType: animal.ownerType || animal.publishType, 
          message: adoptionMessage,
          animalName: animal.name,
          animalSpecies: animal.species,
          animalImage: animal.images && animal.images.length > 0 ? animal.images[0] : null
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        document.getElementById('adoptionModal').close();
        setAdoptionMessage('');
        // Afficher le modal de confirmation au lieu de l'alerte
        setShowConfirmation(true);
      } else {
        throw new Error(data.message || 'Une erreur est survenue lors de l\'envoi de la demande');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la demande d\'adoption:', error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailContact = () => {
    // Vérifier si l'animal existe d'abord
    if (!animal) {
      console.log("No animal found");
      return;
    }
    
    const ownerEmail = animal.ownerEmail || (animal.publishEmail || null);
    console.log("Tentative d'envoi d'email au propriétaire:", ownerEmail);
    
    // Vérifier explicitement si l'email du propriétaire existe
    if (ownerEmail) {
      // Créer un sujet d'email formaté
      const emailSubject = `Intérêt pour l'adoption de ${animal.name}`;
      
      // Créer un corps d'email formaté
      const emailBody = `
     Bonjour,

     Je suis intéressé(e) par l'adoption de ${animal.name}, ${animal.gender === 'Male' ? 'le' : 'la'} ${animal.species} de ${animal.age} ans que vous avez mis(e) à l'adoption.

     J'aimerais avoir plus d'informations concernant ${animal.name} et éventuellement organiser une rencontre pour faire sa connaissance.

      Pourriez-vous me préciser:
      - Les conditions d'adoption
      - Si ${animal.name} s'entend bien avec d'autres animaux
      - Les habitudes et besoins spécifiques de ${animal.name}

      Je vous remercie par avance pour votre réponse et reste disponible pour échanger.

      Cordialement,
      ${session?.user?.name || '[Votre nom]'} `;
      
      // Encodage des paramètres pour l'URL mailto
      const encodedSubject = encodeURIComponent(emailSubject);
      const encodedBody = encodeURIComponent(emailBody);
      
      // Ouvrir le client mail avec le template
      const mailtoUrl = `mailto:${ownerEmail}?subject=${encodedSubject}&body=${encodedBody}`;
      
      // Utiliser une nouvelle façon d'ouvrir le client mail
      try {
        window.location.href = mailtoUrl;
      } catch (error) {
        console.error("Erreur lors de l'ouverture du client email:", error);
        alert("Une erreur s'est produite lors de l'ouverture de votre client email. Veuillez essayer à nouveau ou copier l'adresse: " + ownerEmail);
      }
    } else {
      // Message d'alerte si pas d'email disponible
      console.log("Pas d'email trouvé pour l'animal:", animal);
      alert("Désolé, aucune adresse email n'est disponible pour ce contact. Veuillez utiliser notre formulaire d'adoption.");
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading the animal detail...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!animal) {
    return <div className={styles.notFound}>No animal found</div>;
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
            {animal.images.length > 1 && (
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
            )}
            
            {/* Image counter */}
            {animal.images.length > 1 && (
              <div className={styles.imageCounter}>
                {selectedImageIndex + 1} / {animal.images.length}
              </div>
            )}
            
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
          
          {animal.images.length > 1 && (
            <div className={styles.thumbnailsContainer}>
              {animal.images.map((img, index) => (
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
          )}
        </div>
        
        <div className={styles.animalInfoContainer}>
          <h1 className={styles.animalName}>{animal.name}</h1>
          
          <div className={styles.animalDetailsGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Species:</span>
              <span className={styles.detailValue}>{animal.species}</span>
            </div>
            
            {animal.race && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Breed:</span>
                <span className={styles.detailValue}>{animal.race}</span>
              </div>
            )}
            
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Gender:</span>
              <span className={styles.detailValue}>
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
                  {animal.gender}
                </span>
              </span>
            </div>
            
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Age:</span>
              <span className={styles.detailValue}>{animal.age} years</span>
            </div>
            
            {animal.size && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Size:</span>
                <span className={styles.detailValue}>{animal.size}</span>
              </div>
            )}
          </div>
          
          <div className={styles.animalDescription}>
            <h2>About {animal.name}</h2>
            <p>{animal.description}</p>
          </div>
          
          <div className={styles.adoptionSection}>
            <h2>Interested in adoption?</h2>
            <p>If you wish to adopt {animal.name}, please contact {animal.ownerName ? `${animal.ownerName}` : 'us'} to organize a meeting</p>
            
            {animal.ownerPhone && (
              <div className={styles.contactInfo}>
                <span className={styles.contactLabel}>Phone:</span>
                <span className={styles.contactValue}>{animal.ownerPhone}</span>
              </div>
            )}
            
            <div className={styles.contactButtons}>
              <button className={styles.contactButton} onClick={handleContactOwner}>
                Adoption request
              </button>
              
              {animal.ownerEmail && (
                <button className={styles.emailButton} onClick={handleEmailContact}>
                  Contact by email
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal de demande d'adoption */}
      <dialog id="adoptionModal" className={styles.adoptionModal}>
        <div className={styles.modalContent}>
          <h2>Adoption request for {animal.name}</h2>
          
          <form onSubmit={handleAdoptionRequest}>
            <div className={styles.formGroup}>
              <label htmlFor="adoptionMessage">Message to Owner:</label>
              <textarea 
                id="adoptionMessage"
                className={styles.adoptionMessage}
                value={adoptionMessage}
                onChange={(e) => setAdoptionMessage(e.target.value)}
                placeholder={`Hello, I am interested in the adoption of ${animal.name}...`}
                rows={6}
                required
              />
            </div>
            
            <div className={styles.modalButtons}>
              <button 
                type="button" 
                className={styles.cancelButton}
                onClick={() => document.getElementById('adoptionModal').close()}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending in progress...' : 'Send request'}
              </button>
            </div>
          </form>
        </div>
      </dialog>

      {/* Modal de confirmation */}
      {showConfirmation && (
        <div className={styles.confirmationOverlay}>
          <div className={styles.confirmationModal}>
            <div className={styles.confirmationIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
            </div>
            <h2 className={styles.confirmationTitle}>Request Sent Successfully!</h2>
            <p className={styles.confirmationMessage}>
              Your adoption request for {animal.name} has been sent to the owner. 
              They will contact you soon to discuss the next steps.
            </p>
            <button 
              className={styles.confirmationButton}
              onClick={closeConfirmationModal}
            >
             Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimalDetail;