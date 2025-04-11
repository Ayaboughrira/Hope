// components/FeaturedDonations.jsx
'use client'
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import DonationCard from './DonationCard';
import { donationsData } from '../data/donationdata'; // Importation des données
import styles from '../styles/sectionfour.module.css'; // Importation en tant que module CSS

const FeaturedDonations = () => {
  // État pour stocker les dons filtrés (seulement ceux qui ne sont pas des refuges)
  const [featuredDonations, setFeaturedDonations] = useState([]);
  
  useEffect(() => {
    // Filtrer pour exclure les refuges et prendre seulement les 3 premiers éléments
    const filteredDonations = donationsData
      .filter(donation => donation.type !== 'shelter')
      .slice(0, 3);
    
    setFeaturedDonations(filteredDonations);
  }, []);

  return (
    <section className={styles.featuredDonationsSection}>
      <div className={styles.container}>
        <h2 className={styles.sectionTitle}>Dons Récents</h2>
        <p className={styles.sectionDescription}>
          Découvrez les dernières contributions de notre communauté pour aider les animaux dans le besoin
        </p>
        
        <div className={styles.donationsGrid}>
          {featuredDonations.map(donation => (
            <DonationCard key={donation.id} donation={donation} />
          ))}
        </div>
        
        <div className={styles.viewMoreContainer}>
          <Link href="/donations" className={styles.viewMoreButton}>
            Voir plus de dons
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={styles.arrowIcon}>
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedDonations;