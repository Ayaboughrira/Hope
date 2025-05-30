'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../styles/abuseReports.module.css';

export default function AbuseReportCard({ report }) {
  // Format dates for display
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className={styles.abuseReportCard}>
      <div className={styles.cardImageContainer}>
        <Image 
          src={report.photos[0]} 
          alt={`Animal abuse case`}
          className={styles.cardImage}
          width={300}
          height={300}
          priority
        />
        <div className={styles.reportBadge}>Abuse</div>
      </div>
      
      <div className={styles.cardContent}>
        {report.species && (
          <div className={styles.speciesTag}>
            <span>{report.species}</span>
          </div>
        )}
        
        {/* Titre modifié pour afficher le type de maltraitance au lieu du nom de la cité */}
        <h2>{report.abuseType || 'Animal Abuse'} Case</h2>
        
        <p className={styles.location}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {report.location.neighborhood}, {report.location.commune}, {report.location.wilaya}
        </p>
        
        <div className={styles.reportStats}>
          <div className={styles.stat}>
            <span className={styles.statValue}>{formatDate(report.abuseDate)}</span>
            <span className={styles.statLabel}>Date of Abuse</span>
          </div>
          
          <div className={styles.stat}>
            <span className={styles.statValue}>{formatDate(report.publishDate)}</span>
            <span className={styles.statLabel}>Report Date</span>
          </div>
        </div>
        
        {report.description && (
          <div className={styles.caseDescription}>
            <p>{report.description.length > 150 
              ? `${report.description.substring(0, 150)}...` 
              : report.description}
            </p>
          </div>
        )}
        
        <div className={styles.cardFooter}>
          <div className={styles.reportDate}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Reported: {formatDate(report.publishDate)}
          </div>
          
          {/* Remplacer le bouton de formulaire par un lien vers la page de détails */}
          <Link href={`/abuse-reports/${report.id}`} className={styles.contactButton}>
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}