'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styles from '../styles/annoncerproduit.module.css';

export default function ProductForm() {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [formData, setFormData] = useState({
    label: '',
    price: '',
    promotion: '',
    description: '',
    typeId: '', // ID du type de produit sélectionné
    image: null
  });
  
  const [types, setTypes] = useState([]); // Pour stocker les types depuis la BDD
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Charger les types depuis la base de données
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
          setError('Erreur lors du chargement des types: ' + data.message);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des types:', error);
        setError('Erreur lors du chargement des types: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTypes();
  }, []);

  // Vérifier l'authentification
  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/signuplogin');
      return;
    }
  }, [session, status, router]);

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
    
    // Vérifier la session avant la soumission
    if (!session) {
      setError('Session expirée. Veuillez vous reconnecter.');
      setIsSubmitting(false);
      return;
    }
    
    try {
      // Debug: afficher les informations de session
      console.log('Session user:', session.user);
      console.log('User ID:', session.user?.id);
      console.log('User Type:', session.user?.userType);
      
      // Préparer les données du formulaire avec FormData pour l'upload d'image
      const formDataToSend = new FormData();
      formDataToSend.append('label', formData.label);
      formDataToSend.append('price', formData.price);
      formDataToSend.append('promotion', formData.promotion || '0');
      formDataToSend.append('description', formData.description);
      formDataToSend.append('typeId', formData.typeId);
      
      // CORRECTION: Utiliser session.user.id au lieu de session.user.animalrieId
      // Et vérifier que l'utilisateur est bien de type 'store' (animalrie)
      if (session.user?.id && session.user?.userType === 'store') {
        formDataToSend.append('animalrieId', session.user.id);
        console.log('animalrieId ajouté:', session.user.id);
      } else {
        console.log('Utilisateur non autorisé ou non connecté en tant qu\'animalrie');
        console.log('Type d\'utilisateur:', session.user?.userType);
      }
      
      if (formData.image) {
        formDataToSend.append('image', formData.image);
      }
      
      // Debug: afficher le contenu de FormData
      for (let [key, value] of formDataToSend.entries()) {
        console.log(key, value);
      }
      
      // Envoyer les données à notre API route
      const response = await fetch('/api/produits', {
        method: 'POST',
        body: formDataToSend,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erreur lors de la création du produit');
      }
      
      const result = await response.json();
      console.log('Produit créé:', result);
      
      // Réinitialiser le formulaire après soumission
      setFormData({
        label: '',
        price: '',
        promotion: '',
        description: '',
        typeId: '',
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

  // Afficher un loader pendant le chargement
  if (status === 'loading' || loading) {
    return (
      <div className={styles.formContainer}>
        <div className={styles.loading}>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  // Vérifier l'authentification
  if (!session) {
    return (
      <div className={styles.formContainer}>
        <div className={styles.errorMessage}>
          <p>Vous devez être connecté pour accéder à cette page.</p>
        </div>
      </div>
    );
  }

  // Vérifier que l'utilisateur est bien une animalrie
  if (session.user?.userType !== 'store') {
    return (
      <div className={styles.formContainer}>
        <div className={styles.errorMessage}>
          <p>Seules les animalries peuvent publier des produits.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.title}>Publish product</h1>
      
      
      {error && <div className={styles.errorMessage}>{error}</div>}
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="label">Product label :</label>
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
            <label htmlFor="price">Price :</label>
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
          <label htmlFor="typeId">Product Type :</label>
          <select
            id="typeId"
            name="typeId"
            value={formData.typeId}
            onChange={handleChange}
            required
            className={styles.select}
          >
            <option value="">Select a type</option>
            {types.map(type => (
              <option key={type._id} value={type._id}>
                {type.nomType }
              </option>
            ))}
          </select>
          
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="image">Product image :</label>
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
          disabled={isSubmitting || types.length === 0}
        >
          {isSubmitting ? 'Publication in progress...' : 'Publish produit'}
        </button>
      </form>

      {/* Fenêtre modale de succès */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalSuccessIcon}>✓</div>
            <h2 className={styles.modalTitle}>Success!</h2>
            <p className={styles.modalMessage}>Successfully published product !</p>
            <button className={styles.modalButton} onClick={closeModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}