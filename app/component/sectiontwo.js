
//prendre soin section 
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../styles/sectiontwo.module.css';

const AnimalCareSection = () => {
  const animals = [
    {
      id: 1,
      name: "Dogs",
      image: "/images/image4.jpg",
      description: "Conseils pour le bien-être de votre fidèle compagnon: nutrition, exercice et soins spécifiques.",
      slug: "Dogs"
    },
    {
      id: 2,
      name: "Les chats",
      image: "/images/cat-care.jpg",
      description: "Comprendre les besoins uniques des félins pour une vie saine et heureuse à vos côtés.",
      slug: "chats"
    },
    {
      id: 3,
      name: "Les lapins",
      image: "/images/rabbit-care.jpg",
      description: "Guide complet sur l'habitat, l'alimentation et les soins nécessaires pour vos lapins.",
      slug: "lapins"
    },
    
    
  ];

  return (
    <section className={styles.careSection}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Prendre soin de vos animaux</h2>
        <p className={styles.sectionDescription}>
          Découvrez nos guides pour offrir les meilleurs soins à vos compagnons et leur assurer une vie saine et heureuse.
        </p>
        
        <div className={styles.cardsGrid}>
          {animals.map((animal) => (
            <Link 
              href={`/soins/${animal.slug}`} 
              key={animal.id}
              className={styles.cardLink}
            >
              <div className={styles.card}>
                <div className={styles.imageContainer}>
                  <Image 
                    src={animal.image} 
                    alt={animal.name} 
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className={styles.image}
                  />
                  <div className={styles.overlay}></div>
                </div>
                <div className={styles.contentContainer}>
                  <h3 className={styles.cardTitle}>{animal.name}</h3>
                  <p className={styles.cardDescription}>{animal.description}</p>
                  <span className={styles.readMore}>En savoir plus</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AnimalCareSection;