// components/ArticleForm/ArticleForm.js
'use client'

import { useState } from 'react';
import { addArticleToMongoDB } from '../services/articleservices';
import styles from '../styles/articleform.module.css';

export default function ArticleForm() {
  const [article, setArticle] = useState({
    titre: '',
    excerpt: '',
    contenu: '',
    typeArticle: 'care',
    typeAnimal: 'dogs'
  });
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' ou 'error'
  const [showModal, setShowModal] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setArticle(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    
    try {
      // Validation des champs requis
      if (!article.titre || !article.contenu) {
        throw new Error('the title and content are required');
      }
      
      // Ajout de l'article à mongodb via le service
      const docRef = await addArticleToMongoDB({
        ...article,
        dateCreation: new Date()
      });
      
      // Réinitialiser le formulaire
      setArticle({
        titre: '',
        excerpt: '',
        contenu: '',
        typeArticle: 'care',
        typeAnimal: 'dogs'
      });
      
      
     
      setShowModal(true); // Afficher la modale après soumission réussie
    } catch (error) {
      setMessage(`Erreur: ${error.message}`);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Published New Article</h1>
      
      {message && (
        <div className={`${styles.message} ${messageType === 'error' ? styles.error : styles.success}`}>
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="titre" className={styles.label}>
            Title of the Article * :
          </label>
          <input
            type="text"
            id="titre"
            name="titre"
            value={article.titre}
            onChange={handleChange}
            className={styles.input}
            required
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="excerpt" className={styles.label}>
           Excerpt :
          </label>
          <input
            type="text"
            id="excerpt"
            name="excerpt"
            value={article.excerpt}
            onChange={handleChange}
            className={styles.input}
          />
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="contenu" className={styles.label}>
            Contents of the Article* :
          </label>
          <textarea
            id="contenu"
            name="contenu"
            value={article.contenu}
            onChange={handleChange}
            rows="10"
            className={styles.textarea}
            required
          ></textarea>
        </div>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="typeArticle" className={styles.label}>
              Type :
            </label>
            <select
              id="typeArticle"
              name="typeArticle"
              value={article.typeArticle}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="care">Care</option>
              <option value="food">Food</option>
              <option value="health">Health</option>
            </select>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="typeAnimal" className={styles.label}>
             Animal type :
            </label>
            <select
              id="typeAnimal"
              name="typeAnimal"
              value={article.typeAnimal}
              onChange={handleChange}
              className={styles.select}
            >
              <option value="dogs">Dogs</option>
              <option value="cats">Cats</option>
              <option value="birds">Birds</option>
            </select>
          </div>
        </div>
        
        <div className={styles.buttonContainer}>
          <button
            type="submit"
            disabled={loading}
            className={styles.button}
          >
            {loading ? 'Publication en progress...' : 'Publish the Article '}
          </button>
        </div>
      </form>

      {/* Modal de confirmation */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.checkmarkContainer}>
              <div className={styles.checkmark}></div>
            </div>
            <h2 className={styles.modalTitle}>Article published!</h2>
            <p className={styles.modalMessage}>Your article has been published successfully.</p>
            <button 
              className={styles.closeButton}
              onClick={closeModal}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}