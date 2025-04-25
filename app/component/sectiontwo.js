
//prendre soin section 
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../styles/sectiontwo.module.css';

const AnimalCareSection = () => {
  const animals = [
    {
      id: 1,
      name: "Cats",
      image: "/images/image4.jpg",
      description: " Tips for your loyal companion’s well-being: Nutrition, exercise, and specialized care.",
      slug: "cats"
    },
    {
      id: 2,
      name: "Dogs",
      image: "/images/cat-care.jpg",
      description: " Feline-specific care essentials: Building the foundation for lifelong health and happiness.",
      slug: "dogs"
    },
    {
      id: 3,
      name: "Birds",
      image: "/images/rabbit-care.jpg",
      description: "Complete Guide to Habitat, Nutrition, and Essential Care for Your Birds.",
      slug:"birds"
    },
    
    
  ];

  return (
    <section className={styles.careSection}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Taking care of your pets</h2>
        <p className={styles.sectionDescription}>
        Discover our guides to provide the best care for your companions and ensure they live a healthy, happy life.     
        </p>
        
        <div className={styles.cardsGrid}>
          {animals.map((animal) => (
            <Link 
              href={`/prendresoin/${animal.slug}`} 
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
                  <span className={styles.readMore}>Discover more</span>
                </div>
              </div>
            </Link>
          )) }
        </div>
      </div>
    </section>
  );
};

export default AnimalCareSection;