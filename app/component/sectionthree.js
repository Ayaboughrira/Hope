// components/AdoptionSection.jsx
import React from 'react';
import Link from 'next/link';
import styles from '../styles/sectionthree.module.css';

const AdoptionSection = () => {
  return (
    <>
      {/* SVG pour les vagues - invisible mais utilisé pour le clip-path */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <clipPath id="sectionWaveShape" clipPathUnits="objectBoundingBox">
            <path d="M0,0.05 C0.05,0.02 0.1,0.08 0.15,0.05 C0.2,0.02 0.25,0.08 0.3,0.05 C0.35,0.02 0.4,0.08 0.45,0.05 C0.5,0.02 0.55,0.08 0.6,0.05 C0.65,0.02 0.7,0.08 0.75,0.05 C0.8,0.02 0.85,0.08 0.9,0.05 C0.95,0.02 1,0.08 1,0.05 L1,0.95 C1,0.92 0.95,0.98 0.9,0.95 C0.85,0.92 0.8,0.98 0.75,0.95 C0.7,0.92 0.65,0.98 0.6,0.95 C0.55,0.92 0.5,0.98 0.45,0.95 C0.4,0.92 0.35,0.98 0.3,0.95 C0.25,0.92 0.2,0.98 0.15,0.95 C0.1,0.92 0.05,0.98 0,0.95 L0,0.05" />
          </clipPath>
        </defs>
      </svg>
      
      <section className={styles.adoptionSection}>
        <div className={styles.overlay}>
          <div className={styles.content}>
            <h2 className={styles.title}>Adoption</h2>
            <p className={styles.description}>
            Adopting a pet is an act of love that changes two lives forever—the animal's and their new owner's. Every year, thousands of animals wait , hoping to find their forever family.
            </p>
            <p className={styles.objective}>
              Notre objectif est de faciliter cette rencontre et de garantir que chaque animal 
              trouve un foyer aimant où il pourra s'épanouir. Nous nous assurons que tous nos 
              animaux sont en bonne santé, vaccinés et prêts à rejoindre leur nouvelle famille.
            </p>
            <Link href="/catalogueanimal" className={styles.button}>
              Découvrez nos animaux à l'adoption
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default AdoptionSection;