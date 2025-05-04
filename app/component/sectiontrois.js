// components/AdoptionSection.jsx
import React from 'react';
import Link from 'next/link';
import { Heart, PawPrint } from 'lucide-react';
import styles from '../styles/sectiontrois.module.css';

const AdoptionSection = () => {
  return (
    <section className={styles.adoptionSectionContainer}>
      
      <div className={styles.contentContainer}>
        <div className={styles.textSection}>
          <h2 className={styles.sectionTitle}>Adoption</h2>
          <h3 className={styles.subtitle}>Give a second chance to our four-legged friends</h3>
          
          <div className={styles.definitionBox}>
            <Heart className={styles.heartIcon} />
            <p className={styles.definition}>
            Adoption is an act of love that transforms two lives: yours and the animal's. 
            It's a commitment to provide a loving, stable home for a pet in need.
            </p>
          </div>
          
          <div className={styles.objectivesContainer}>
            <h4 className={styles.objectivesTitle}>Our  objectives :</h4>
            <ul className={styles.objectivesList}>
              <li>
                <PawPrint className={styles.pawIcon} />
                <span>Giving abandoned or mistreated animals a second chance.</span>
              </li>
              <li>
                <PawPrint className={styles.pawIcon} />
                <span>Raise awareness of the animal cause and responsible adoption.</span>
              </li>
              <li>
                <PawPrint className={styles.pawIcon} />
                <span>Reduce the number of homeless animals in our community.</span>
              </li>
              <li>
                <PawPrint className={styles.pawIcon} />
                <span>Facilitate the search for a life partner that suits you.</span>
              </li>
            </ul>
          </div>
          
          <Link href="/catalogueanimal" className={styles.discoverButton}>
            <span>Discover Our Animals for Adoption</span>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.arrowIcon}>
              <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        </div>
        
        <div className={styles.imageSection}>
          <div className={styles.beachDogImageContainer}>
            <img src="./images/image4.jpg" alt="animale" className={styles.beachDogImage} />
          </div>
        </div>
      </div>
      
      
    </section>
  );
};

export default AdoptionSection;