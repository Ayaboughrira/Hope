'use client'

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styles from '../styles/articleform.module.css';

export default function CreateArticle() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [formData, setFormData] = useState({
    titre: '',
    excerpt: '',
    contenu: '',
    typeArticle: 'care',
    typeAnimal: 'cats'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', type: '' });
  const [showModal, setShowModal] = useState(false);
  const [submittedAnimal, setSubmittedAnimal] = useState('');

  // Check if user is authenticated when component mounts
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/signuplogin?callbackUrl=/articleform&message=Please log-in to post articles');
    }
  }, [status, router]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getUserTypeDisplay = (userType) => {
    const types = {
      'vet': 'Veterinairian',
      'association': 'Association',
      'owner': 'Pet Owner',
      'store': 'Pet Store'
    };
    return types[userType] || userType;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback({ message: '', type: '' });
    
    // Save the selected animal type for redirection
    setSubmittedAnimal(formData.typeAnimal);

    try {
      // Check if user is authenticated
      if (!session) {
        throw new Error('Vous devez être connecté pour publier des articles');
      }

      // Validate data
      if (!formData.titre || !formData.excerpt || !formData.contenu) {
        throw new Error('Please fill in all required fields');
      }

      // Prepare article data with author information
      const articleData = {
        ...formData,
        auteurId: session.user.id,
        auteurType: session.user.userType,
      //auteur information
        auteurNom: session.user.name,
        auteurPrenom: session.user.firstName,
        auteurNomFamille: session.user.lastName,
        clinicName: session.user.clinicName,
        associationName: session.user.associationName,
        storeName: session.user.storeName
      };

      // Send data to API
      const response = await fetch('/api/article', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(articleData),
      });

      // Check if response is OK
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Error while creating the article';
        
        try {
          // Try to parse JSON error
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorMessage;
        } catch (parseError) {
          // If parsing fails, use raw text
          console.error('JSON parsing error:', parseError);
          errorMessage = errorText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      // If response is OK, parse JSON
      const result = await response.json();
      
      // Reset form
      setFormData({
        titre: '',
        excerpt: '',
        contenu: '',
        typeArticle: 'care',
        typeAnimal: 'cats'
      });
      
      // Show success modal
      setFeedback({
        message: 'Article published successfully !',
        type: 'success'
      });
      setShowModal(true);
      
    } catch (error) {
      console.error("Error:", error);
      setFeedback({
        message: error.message || 'Une erreur est survenue',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    // Redirect using the submitted animal type
    router.push(`/prendresoin/${submittedAnimal}`);
  };

  // Close modal after 3 seconds
  useEffect(() => {
    let timer;
    if (showModal) {
      timer = setTimeout(() => {
        closeModal();
      }, 3000);
    }
    return () => clearTimeout(timer);
  }, [showModal]);

  // Show loading or redirect to login if not authenticated
  if (status === 'loading') {
    return <div className={styles.loadingContainer}>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return null; // Will redirect via useEffect
  }

  // Determine author display based on user type
  let authorDisplay;
  if (session?.user) {
    switch (session.user.userType) {
      case 'vet':
        authorDisplay = `Veterinairian  ${session.user.clinicName || ''}`;
        break;
      case 'association':
        authorDisplay = `Association ${session.user.associationName || ''}`;
        break;
      
      default:
        authorDisplay = session.user.name;
    }
  }

  return (
    <div className={styles.formContainer}>
      <h1 className={styles.pageTitle}>Creat a New Article</h1>
      
      {feedback.type === 'error' && (
        <div className={`${styles.feedback} ${styles.error}`}>
          {feedback.message}
        </div>
      )}
      
      {/* Success Modal */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <div className={styles.modalIcon}>✓</div>
              <h2 className={styles.modalTitle}>Success !</h2>
              <p className={styles.modalMessage}>{feedback.message}</p>
              <p className={styles.modalRedirect}>Redirection en progress ...</p>
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
        <div className={styles.authorInfo}>
          <p>Publication as: <strong>{authorDisplay}</strong> ({getUserTypeDisplay(session?.user?.userType)})</p>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="typeAnimal" className={styles.formLabel}>
            Animal Type : 
            <select
              id="typeAnimal"
              name="typeAnimal"
              value={formData.typeAnimal}
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
           Article Type:
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
           Article Title:
            <input
              type="text"
              id="titre"
              name="titre"
              value={formData.titre}
              onChange={handleChange}
              className={styles.formInput}
              placeholder="Title of article"
              required
            />
          </label>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="excerpt" className={styles.formLabel}>
            Excerpt:
            <textarea
              id="excerpt"
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              className={styles.formTextarea}
              placeholder="Brief summary of the article"
              rows="3"
              required
            />
          </label>
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="contenu" className={styles.formLabel}>
            Content:
            <textarea
              id="contenu"
              name="contenu"
              value={formData.contenu}
              onChange={handleChange}
              className={styles.formTextarea}
              placeholder="detailled content of the article"
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
            {isSubmitting ? 'Publication in progress...' : 'Publish Now'}
          </button>
        </div>
      </form>
    </div>
  );
}