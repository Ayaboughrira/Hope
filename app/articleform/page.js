'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../styles/articleform.module.css';

export default function CreateArticle() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    titre: '',
    excerpt: '',
    contenu: '',
    typeArticle: 'care',
    animal: 'cats'
  });l
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [showModal, setShowModal] = useState(false);
  const [submittedAnimal, setSubmittedAnimal] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback({ message: '', type: '' });
    
    // Sauvegarder l'animal sélectionné lors de la soumission
    setSubmittedAnimal(formData.animal);

    try {
      // Valider les données
      if (!formData.titre || !formData.excerpt || !formData.contenu) {
        throw new Error(' Please fill in all required fields');
      }

      // Envoyer les données à l'API
      const response = await fetch('/api/article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      // Vérifier si la réponse est OK
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Erreur lors de la création de l\'article';
        
        try {
          // Essayer de parser le texte en JSON
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch (parseError) {
          // Si le parsing échoue, utiliser le texte brut
          console.error('Erreur de parsing JSON:', parseError);
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      // Si la réponse est OK, parser le JSON
      const result = await response.json();
      
      // Réinitialiser le formulaire
      setFormData({
        titre: '',
        excerpt: '',
        contenu: '',
        typeArticle: 'care',
        animal: 'cats'
      });
      
      // Afficher la modale de succès
      setFeedback({
        message: 'Article added with success !',
        type: 'success'
      });
      setShowModal(true);
      
    } catch (error) {
      console.error("Erreur:", error);
      setFeedback({
        message: error.message || 'Une erreur s\'est produite',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    // Rediriger en utilisant la valeur de l'animal soumis
    router.push(`/prendresoin/${submittedAnimal}`);
  };

  // Fermer la modale après 3 secondes
  useEffect(() => {
    let timer;
    if (showModal) {
      timer = setTimeout(() => {
        closeModal();
      }, 2000);
    }
    return () => clearTimeout(timer);
  }, [showModal]);

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.pageTitle}>Creat a new article</h1>
      
      {feedback.type === 'error' && (
        <div className={`${styles.feedback} ${styles.error}`}>
          {feedback.message}
        </div>
      )}
      
      {/* Modal de succès */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <div className={styles.modalIcon}>✓</div>
              <h2 className={styles.modalTitle}>Success!</h2>
              <p className={styles.modalMessage}>{feedback.message}</p>
              <p className={styles.modalRedirect}>Redirection in progress...</p>
              <button 
                className={styles.modalButton} 
                onClick={closeModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className={styles.articleForm}>
        <div className={styles.formGroup}>
          <label htmlFor="animal" className={styles.formLabel}>
            Animal Type : 
            <select
              id="animal"
              name="animal"
              value={formData.animal}
              onChange={handleChange}
              className={styles.formSelect}
              required
            >
              <option value="cats">Cats</option>
              <option value="dogs">Dogs</option>
              <option value="birds">Birds</option>
            </select>
          </label>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="typeArticle" className={styles.formLabel}>
           Article Type :
            <select
              id="typeArticle"
              name="typeArticle"
              value={formData.typeArticle}
              onChange={handleChange}
              className={styles.formSelect}
              required
            >
              <option value="care">Care</option>
              <option value="food">Food</option>
              <option value="health">Health</option>
            </select>
          </label>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="titre" className={styles.formLabel}>
            Article Title :
            <input
              type="text"
              id="titre"
              name="titre"
              value={formData.titre}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="Title of the article"
              required
            />
          </label>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="excerpt" className={styles.formLabel}>
            Excerpt :
            <textarea
              id="excerpt"
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              className={styles.formTextarea}
              placeholder="Bref summary of the article"
              rows="3"
              required
            />
          </label>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="contenu" className={styles.formLabel}>
            Content :
            <textarea
              id="contenu"
              name="contenu"
              value={formData.contenu}
              onChange={handleChange}
              className={styles.formTextarea}
              placeholder="Detailled content of the article"
              rows="10"
              required
            />
          </label>
        </div>

        <div className={styles.buttonContainer}>
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Published in progress...' : 'Publish article'}
          </button>
        </div>
      </form>
    </div>
  );
}