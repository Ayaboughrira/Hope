'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from '../styles/disappearances.module.css';

export default function MissingAnimalCard({ report }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Format dates for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate days missing
  const calculateDaysMissing = (disappearanceDate) => {
    if (!disappearanceDate) return 'N/A';
    const diffTime = Math.abs(new Date() - new Date(disappearanceDate));
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <>
      <div className={styles.disappearReportCard}>
        <div className={styles.cardImageContainer}>
          <Image 
            src={report.photos && report.photos.length > 0 ? report.photos[0] : '/placeholder-pet.jpg'} 
            alt={`Missing ${report.species} - ${report.breed}`}
            className={styles.cardImage}
            width={300}
            height={300}
            priority
          />
          <div className={styles.reportBadge}>Missing</div>
        </div>
        
        <div className={styles.cardContent}>
          <div className={styles.speciesTag}>
            <span>{report.species || 'Unknown'}</span>
          </div>
          
          <h2>{report.breed || 'Unknown'} ({report.gender || 'Unknown'})</h2>
          
          <p className={styles.location}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {report.location?.commune || 'Unknown'}, {report.location?.wilaya || 'Unknown'}
          </p>
          
          <div className={styles.reportStats}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{formatDate(report.disappearanceDate)}</span>
              <span className={styles.statLabel}>Date Missing</span>
            </div>
            
            <div className={styles.stat}>
              <span className={styles.statValue}>{calculateDaysMissing(report.disappearanceDate)}</span>
              <span className={styles.statLabel}>Days Missing</span>
            </div>
            
            <div className={styles.stat}>
              <span className={styles.statValue}>{formatDate(report.publishDate)}</span>
              <span className={styles.statLabel}>Report Date</span>
            </div>
          </div>
          
          <div className={styles.cardFooter}>
            <div className={styles.reportDate}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Reported: {formatDate(report.publishDate)}
            </div>
            
            <button 
              onClick={() => setIsModalOpen(true)} 
              className={styles.contactButton}
            >
              I've seen this animal
            </button>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {isModalOpen && (
        <div className={styles.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={() => setIsModalOpen(false)}>×</button>
            
            <h3>Report Sighting: {report.breed} {report.species}</h3>
            <p>Missing from {report.location?.commune}, {report.location?.wilaya} since {formatDate(report.disappearanceDate)}</p>
            
            <form>
              <div className={styles.formGroup}>
                <label htmlFor="name">Your Name</label>
                <input type="text" id="name" required />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="contact">Contact Information</label>
                <input type="text" id="contact" placeholder="Email or phone number" required />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="location">Where did you see this animal?</label>
                <input type="text" id="location" required />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="date">When did you see this animal?</label>
                <input type="date" id="date" required />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="details">Additional Details</label>
                <textarea id="details" placeholder="Please provide any additional information that might help"></textarea>
              </div>
              
              <div className={styles.formActions}>
                <button type="submit" className={styles.submitButton}>Submit Report</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}