'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../styles/annoncerproduit.module.css';


export default function ProductForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    label: '',
    price: '',
    promotion: '',
    description: '',
    category: 'dog',
    image: null
  });
  
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false); 

  // Effet pour empêcher le défilement quand la modale est ouverte
  useEffect(() => {
    if (showModal) {
      document.body.style.overflow = 'hidden';
      
      // Fermeture automatique après 3 secondes
      const timer = setTimeout(() => {
        closeModal();
      }, 3000);
      
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = 'unset';
      };
    }
  }, [showModal]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        image: file
      }));
      
      // Créer un aperçu de l'image
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Fonction pour fermer la modale et rediriger
  const closeModal = () => {
    setShowModal(false);
    router.push('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    
    try {
      // 1. Préparer les données du formulaire avec FormData pour l'upload d'image
      const formDataToSend = new FormData();
      formDataToSend.append('label', formData.label);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('promotion', formData.promotion || '0');
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }
      
      // 2. Envoyer les données à notre API route qui s'occupera de Cloudinary et MongoDB
      const response = await fetch('/api/produits', {
        method: 'POST',
        body: formDataToSend,
        // Ne pas définir Content-Type header quand on utilise FormData,
        // le navigateur le fait automatiquement avec la boundary correcte
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création du produit');
      }
      
      const result = await response.json();
      
      // 3. Réinitialiser le formulaire après soumission
      setFormData({
        label: '',
        price: '',
        promotion: '',
        description: '',
        category: 'dog',
        image: null
      });
      setImagePreview(null);
      
    
      setShowModal(true);
      
    } catch (error) {
      console.error("Erreur lors du partage du produit:", error);
      setError("Une erreur est survenue lors du partage du produit: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.title}>Publish product</h1>
      
      {error && <div className={styles.errorMessage}>{error}</div>}
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="libelle">Product label :</label>
          <input
            type="text"
            id="label"
            name="label"
            value={formData.label}
            onChange={handleChange}
            required
            className={styles.input}
          />
        </div>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="prix">Price : </label>
            <input
              type="number"
              id="price"
              name="price"
              min="0"
              step="0.01"
              value={formData.price}
              onChange={handleChange}
              required
              className={styles.input}
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="promotion">Promotion (%) :</label>
            <input
              type="number"
              id="promotion"
              name="promotion"
              min="0"
              max="100"
              value={formData.promotion}
              onChange={handleChange}
              className={styles.input}
            />
          </div>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="description">Description :</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows="4"
            className={styles.textarea}
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="categorie">Category :</label>
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={styles.select}
          >
            <option value="dog">Dog</option>
            <option value="cats">Cat</option>
            <option value="birds">Birds</option>
          </select>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="image">product image </label>
          <input
            type="file"
            id="image"
            name="image"
            accept="image/*"
            onChange={handleImageChange}
            required
            className={styles.fileInput}
          />
          
          {imagePreview && (
            <div className={styles.imagePreview}>
              <img src={imagePreview} alt="Aperçu de l'image" />
            </div>
          )}
        </div>
        
        <button
          type="submit" 
          className={styles.submitButton}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Published in progress...' : 'Publish product '}
        </button>
      </form>

      {/* Fenêtre modale de succès */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalSuccessIcon}>✓</div>
            <h2 className={styles.modalTitle}>success!</h2>
            <p className={styles.modalMessage}>Successfully Published product!</p>
            <button className={styles.modalButton} onClick={closeModal}>
             Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}