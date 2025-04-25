'use client'
import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from '../styles/sectionone.module.css';

const HeroCarousel = () => {
  // Données des slides avec mots en orange dans les titres
  const slides = [
    {
      id: 1,
      imageUrl: "/images/image7.jpg",
      title:  "Open your heart, adopt a <span> furry </span> friend!",
      description: "Every adoption story begins with a second chance."
    },
    {
      id: 2,
      imageUrl: "/images/image8.jpg",
      title: "Find your perfect companion<span> today</span>",
      description: "Pets are our passion and safety is our promise.",
      
    },
    {
      id: 3,
      imageUrl: "/images/image9.jpg",
      title: "Forever <span> friends </span>",
      description: "Every animal deserves a loving home. Your adoption can save a life and brighten your days."
    }
  ];

  // État pour suivre l'index du slide actuel
  const [currentSlide, setCurrentSlide] = useState(0);

  // Fonction pour passer au slide suivant
  const nextSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide === slides.length - 1 ? 0 : prevSlide + 1));
  };

  // Fonction pour passer au slide précédent
  const prevSlide = () => {
    setCurrentSlide((prevSlide) => (prevSlide === 0 ? slides.length - 1 : prevSlide - 1));
  };

  // Mise en place du défilement automatique toutes les 5 secondes
  useEffect(() => {
    const intervalId = setInterval(() => {
      nextSlide();
    }, 5000);

    // Nettoyage de l'intervalle lors du démontage du composant
    return () => clearInterval(intervalId);
  }, []);

  return (
    <>
      {/* SVG pour les vagues - invisible mais utilisé pour le clip-path */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <clipPath id="waveShape" clipPathUnits="objectBoundingBox">
            <path d="M0,0 L1,0 L1,0.97 C0.85,0.95 0.8,0.98 0.75,0.95 C0.7,0.92 0.65,0.98 0.6,0.95 C0.55,0.92 0.5,0.98 0.45,0.95 C0.4,0.92 0.35,0.98 0.3,0.95 C0.25,0.92 0.2,0.98 0.15,0.95 C0.1,0.92 0.05,0.98 0,0.95 Z" />
          </clipPath>
        </defs>
      </svg>
      
      <section className={styles.heroSection}>
        <div className={styles.carouselContainer}>
          {slides.map((slide, index) => (
            <div
              key={slide.id}
              className={`${styles.slide} ${index === currentSlide ? styles.active : ''}`}
            >
              <div className={styles.imageContainer}>
                <div 
                  className={styles.backgroundImage}
                  style={{ backgroundImage: `url(${slide.imageUrl})` }}
                />
                <div className={styles.overlay}></div>
              </div>
              
              <div className={styles.content}>
                <h2 className={styles.title} dangerouslySetInnerHTML={{ __html: slide.title }}></h2>
                <p className={styles.description}>{slide.description}</p>
                <Link href="/catalogueanimal" className={styles.adoptButton}>
                  Adopt Now
                </Link>
              </div>
            </div>
          ))}
          
          {/* Contrôles du carrousel en orange */}
          <button className={`${styles.carouselControl} ${styles.prev}`} onClick={prevSlide}>
            <span>&lt;</span>
          </button>
          <button className={`${styles.carouselControl} ${styles.next}`} onClick={nextSlide}>
            <span>&gt;</span>
          </button>
          
          {/* Indicateurs de position */}
          <div className={styles.indicators}>
            {slides.map((_, index) => (
              <button
                key={index}
                className={`${styles.indicator} ${index === currentSlide ? styles.active : ''}`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default HeroCarousel;