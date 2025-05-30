'use client';

import React, { useState, useRef, useEffect } from 'react';
import styles from '../../styles/donformulaire.module.css';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SuccessModal from '../SuccessModal'; // Importer le composant modal

function DonFormulaire() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [donData, setDonData] = useState({
    typeId: '', // Changé de 'type' à 'typeId'
    nom: '',
    message: '',
  });
  
  const [photos, setPhotos] = useState([]);
  const [types, setTypes] = useState([]); // État pour stocker les types de dons
  const [isLoadingTypes, setIsLoadingTypes] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false); // État pour le modal
  const fileInputRef = useRef(null);

   
  // Charger les types de dons depuis la base de données
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        const response = await fetch('/api/type'); 
        const result = await response.json();
        
        if (result.success) {
          setTypes(result.data);
        } else {
          setError('Erreur lors du chargement des types de dons');
        }
      } catch (error) {
        console.error('Erreur lors du chargement des types:', error);
        setError('Erreur de connexion lors du chargement des types');
      } finally {
        setIsLoadingTypes(false);
      }
    };

    fetchTypes();
  }, []);

  // Rediriger si non connecté - APRÈS tous les hooks
  if (status === "loading") return <div>Chargement...</div>;
  if (status === "unauthenticated") {
    router.push('/signuplogin');
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setDonData({
      ...donData,
      [name]: value
    });
  };

  // Fonction pour gérer l'upload de photos
  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Limiter le nombre de photos à 2 maximum
    const newPhotos = [...photos];
    const remainingSlots = 2 - newPhotos.length;
    
    if (remainingSlots > 0) {
      const filesToAdd = files.slice(0, remainingSlots);
      
      filesToAdd.forEach(file => {
        // Ajouter uniquement les fichiers image
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            newPhotos.push({
              file: file,
              preview: e.target.result,
              name: file.name
            });
            setPhotos([...newPhotos]);
          };
          reader.readAsDataURL(file);
        }
      });
    }
  };
  
  // Fonction pour supprimer une photo
  const removePhoto = (index) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  // Fonction pour fermer le modal et réinitialiser le formulaire
  const handleCloseModal = () => {
    setShowSuccessModal(false);
    // Réinitialiser le formulaire
    setDonData({
      typeId: '',
      nom: '',
      message: ''
    });
    setPhotos([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    // Vérifier si au moins 1 photo est requise
    if (photos.length < 1) {
      setError('Veuillez ajouter au moins une photo pour votre don.');
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Créer FormData pour l'envoi
      const formData = new FormData();
      formData.append('typeId', donData.typeId); // Envoyer directement l'ID du type
      formData.append('nom', donData.nom);
      formData.append('message', donData.message);
      
      // Ajouter les photos
      photos.forEach(photo => {
        formData.append('photos', photo.file);
      });
      
      const response = await fetch('/api/Don', {
        method: 'POST',
        body: formData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Afficher le modal de succès au lieu de l'alert
        setShowSuccessModal(true);
      } else {
        setError(result.message || 'Erreur lors de la création du don');
      }
      
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      setError('Erreur de connexion. Veuillez réessayer.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.formulaire}>
      <h2>Donate Now</h2>
      {error && <div className={styles.errorMessage}>{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className={styles.inputGroup}>
          <label>Type de don:</label>
          <select
            name="typeId"
            value={donData.typeId}
            onChange={handleChange}
            required
            disabled={isLoadingTypes}
          >
            <option value="">
              {isLoadingTypes ? 'Chargement des types...' : 'Sélectionnez un type'}
            </option>
            {types.map((type) => (
              <option key={type._id} value={type._id}>
                {type.nomType}
              </option>
            ))}
          </select>
        </div>
        
        <div className={styles.inputGroup}>
          <label>Donation name:</label>
          <input
            type="text"
            name="nom"
            value={donData.nom}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className={styles.inputGroup}>
          <label>Description:</label>
          <textarea
            name="message"
            value={donData.message}
            onChange={handleChange}
            placeholder="Let us know more about your donation or leave a kind word of support!"
            required
          />
        </div>
        
        {/* Système d'upload de photos */}
        <div className={styles.inputGroup}>
          <label>Photos (Obligatoire):</label>
          <div className={styles.photoUploadContainer}>
            <div className={styles.photoPreviewArea}>
              {photos.map((photo, index) => (
                <div key={index} className={styles.photoPreview}>
                  <img src={photo.preview} alt={`Uploaded ${index + 1}`} />
                  <button 
                    type="button" 
                    className={styles.removePhotoBtn}
                    onClick={() => removePhoto(index)}
                  >
                    ×
                  </button>
                  <span className={styles.photoName}>{photo.name}</span>
                </div>
              ))}
              
              {photos.length < 2 && (
                <div 
                  className={styles.photoPlaceholder}
                  onClick={() => fileInputRef.current.click()}
                >
                  <span>+</span>
                  <p>Add Photo</p>
                </div>
              )}
            </div>
            
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handlePhotoChange}
              style={{ display: 'none' }}
              multiple={true}
            />
            
            <div className={styles.photoUploadInfo}>
              <p>Required: 1 photo(s) minimum - Maximum: 2 photo(s)</p>
              <button 
                type="button" 
                className={styles.uploadBtn}
                onClick={() => fileInputRef.current.click()}
              >
                Browse...
              </button>
            </div>
          </div>
        </div>
        
        <button 
          type="submit" 
          className={`${styles.btn} ${styles.btnSubmit}`}
          disabled={photos.length < 1 || isSubmitting || isLoadingTypes}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? 'Sending...' : 'Send My Donation'}
        </button>
      </form>

      {/* Modal de succès */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseModal}
        title="Thank You for Your Generosity!"
        message="Your donation has been shared with the community and will help animals in need."
      />
    </div>
  );
}

export default DonFormulaire;