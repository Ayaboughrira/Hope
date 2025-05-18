'use client'

import React, { useState, useEffect, use } from 'react';
import { notFound } from 'next/navigation';
import styles from '../../styles/prendresoin.module.css';

export default function AnimalArticles({ params }) {
  const resolvedParams = use(params);
  const { animal } = resolvedParams;
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [animalType, setAnimalType] = useState(null);

  // Initialiser animalType à partir des params
  useEffect(() => {
    if (resolvedParams && resolvedParams.animal) {
      setAnimalType(resolvedParams.animal);
    }
  }, [resolvedParams]);
  
  // Fonction pour récupérer les articles depuis l'API
  async function fetchArticles(animal, type = 'all') {
    if (!animal) return;

    try {
      setLoading(true);
      
      console.log("Load articles for:", animal, "type:", type);
      
      // Construction de l'URL API avec les paramètres
      const apiUrl = `/api/article/${animal}${type !== 'all' ? `?type=${type}` : ''}`;
      // Appel à l'API
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        console.error("Erreur API:", response.status, response.statusText);
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Articles récupérés:", data.length);
      
      setArticles(data);
      
      // Vérifier si l'animal est valide et s'il y a des articles
      if (data.length === 0) {
        console.log("Aucun article trouvé pour:", animal);
        
        // Vérifier si l'animal est valide
        const validAnimals = ['cats', 'dogs', 'birds'];
        if (!validAnimals.includes(animal)) {
          console.log("Animal non valide:", animal);
          notFound();
        }
      }
    } catch (error) {
      console.error("Error while retrieving articles:", error);
    } finally {
      setLoading(false);
    }
  }
  
  // Effet pour charger les articles au chargement initial
  useEffect(() => {
    if (animalType) {
      fetchArticles(animalType, filterType);
      
      // Mettre à jour le titre de la page
      const animalNames = {
        'cats': 'Cats',
        'dogs': 'Dogs',
        'birds': 'Birds'
      };
      document.title = `Articles for  ${animalNames[animalType] || animalType} | PetCare`;
    }
  }, [animalType, filterType]);
  
  const animalNames = {
    'cats': 'Cats',
    'dogs': 'Dogs',
    'birds': 'Birds'
  };
  
  // Fonction pour changer le type de filtre
  const handleFilterChange = (type) => {
    setFilterType(type);
    // Le chargement des articles se fera via l'effet useEffect qui observe filterType
  };

  // Ouvrir la modal avec l'article sélectionné
  const openModal = (article) => {
    setSelectedArticle(article);
    setModalOpen(true);
    // Empêcher le défilement du corps lorsque la modal est ouverte
    document.body.style.overflow = 'hidden';
  };

  // Fermer la modal
  const closeModal = () => {
    setModalOpen(false);
    setSelectedArticle(null);
    // Restaurer le défilement du corps
    document.body.style.overflow = 'auto';
  };

  // Formater le contenu de l'article avec des sauts de paragraphe
  const formatContent = (contenu) => {
    if (!contenu) return <p>Not available content </p>;
    
    // Si le contenu est une chaîne, le diviser en paragraphes
    if (typeof contenu === 'string') {
      return contenu.split('\n').map((paragraph, index) => 
        <p key={index} className={styles.paragraph}>{paragraph}</p>
      );
    }
    
    return <p>{contenu}</p>;
  };

  // Fonction pour afficher le nom de l'auteur selon son type
  const displayAuthorInfo = (article) => {
    if (!article.auteurId || !article.auteurType) {
      return "Auteur inconnu";
    }
    
    switch (article.auteurType) {
      case 'vet':
        return `Veterinairian   ${article.clinicName || ''}`;
      case 'association':
        return `Association  ${article.nomAssociation || ''}`;
      default:
        return "Auteur";
    }
  };

  if (loading) {
    return <div className={styles.loadingContainer}>Load articles...</div>;
  }

  return (
    <div className={styles.pageContainer}>
      <h1 className={styles.pageTitle}>Articles for {animalNames[animal]}</h1>
      
      <div className={styles.filterContainer}>
        <button 
          className={`${styles.filterButton} ${filterType === 'all' ? styles.active : ''}`}
          onClick={() => handleFilterChange('all')}
        >
          All
        </button>
        <button 
          className={`${styles.filterButton} ${filterType === 'care' ? styles.active : ''}`}
          onClick={() => handleFilterChange('care')}
        >
          Care
        </button>
        <button 
          className={`${styles.filterButton} ${filterType === 'food' ? styles.active : ''}`}
          onClick={() => handleFilterChange('food')}
        >
          Food
        </button>
        <button 
          className={`${styles.filterButton} ${filterType === 'health' ? styles.active : ''}`}
          onClick={() => handleFilterChange('health')}
        >
          Health
        </button>
      </div>
      
      <div className={styles.articlesContainer}>
        {articles.length > 0 ? (
          articles.map((article) => (
            <div 
              key={article.id} 
              className={styles.articleCard}
              onClick={() => openModal(article)}
            >
              <div className={styles.articleContent}>
                <h2 className={styles.articleTitle}>{article.titre}</h2>
                <p className={styles.articleExcerpt}>{article.excerpt}</p>
                <div className={styles.articleMeta}>
                  <span className={styles.articleType}>{article.typeArticle}</span>
                  <span className={styles.articleAuthor}>Author: {displayAuthorInfo(article)}</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className={styles.noArticles}>No article found for this filter.</p>
        )}
      </div>

      {/* Modal pour afficher l'article complet */}
      {modalOpen && selectedArticle && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={closeModal}>
              &times;
            </button>
            <h2 className={styles.modalTitle}>{selectedArticle.titre}</h2>
            <div className={styles.modalMeta}>
              <span className={styles.modalType}>{selectedArticle.typeArticle}</span>
              <span className={styles.modalAuthor}>  By: {displayAuthorInfo(selectedArticle)}</span>
              <span className={styles.modalDate}>
                {new Date(selectedArticle.dateCreation).toLocaleDateString('en-US', { 
                  day: 'numeric', 
                  month: 'long', 
                  year: 'numeric' 
                })}
              </span>
            </div>
            <div className={styles.modalBody}>
              {formatContent(selectedArticle.contenu || selectedArticle.excerpt)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}