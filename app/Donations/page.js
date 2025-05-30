"use client";

import { useState, useEffect } from 'react';
import DonationFilter from '../component/donation/DonationFilter';
import DonationCatalog from '../component/donation/DonationCatalog.js';
import styles from '../styles/donations.module.css';

export default function DonationsPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [filteredDonations, setFilteredDonations] = useState([]);
  const [allDonations, setAllDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Charger les données depuis les APIs
  useEffect(() => {
    const fetchDonationsAndShelters = async () => {
      try {
        setLoading(true);
        setError('');

        // Récupérer les dons et refuges en parallèle
        const [donsResponse, refugesResponse] = await Promise.all([
          fetch('/api/Don'),
          fetch('/api/refuge')
        ]);

        const donsResult = await donsResponse.json();
        const refugesResult = await refugesResponse.json();

        if (!donsResult.success || !refugesResult.success) {
          throw new Error('Erreur lors du chargement des données');
        }

        // Transformer les données des dons
        const transformedDons = donsResult.data.map(don => ({
          id: don._id,
          title: don.nom,
          description: don.message,
          date: new Date(don.createdAt).toLocaleDateString('fr-FR'),
          type: don.typeInfo?.nomType?.toLowerCase() || 'other',
          image: don.photos?.[0]?.url || '/images/default-donation.jpg',
          photos: don.photos || [],
          userInfo: don.userInfo,
          typeInfo: don.typeInfo,
          originalData: don
        }));

        // Transformer les données des refuges
        const transformedRefuges = refugesResult.data.map(refuge => ({
          id: refuge._id,
          title: refuge.nom,
          description: refuge.description,
          date: new Date(refuge.createdAt).toLocaleDateString('fr-FR'),
          type: 'shelter',
          image: refuge.photos?.[0]?.url || '/images/default-shelter.jpg',
          photos: refuge.photos || [],
          address: `${refuge.adresse.cite}, ${refuge.adresse.commune}, ${refuge.adresse.wilaya}`,
          capacity: refuge.capacite,
          acceptedAnimals: refuge.typeAnimaux.join(', '),
          contact: refuge.contact,
          userInfo: refuge.userInfo,
          originalData: refuge
        }));

        // Combiner toutes les données
        const combinedData = [...transformedDons, ...transformedRefuges];
        
        // Trier par date de création (plus récent en premier)
        combinedData.sort((a, b) => new Date(b.originalData.createdAt) - new Date(a.originalData.createdAt));

        setAllDonations(combinedData);
        
      } catch (error) {
        console.error('Erreur lors du chargement:', error);
        setError('Erreur lors du chargement des données. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };

    fetchDonationsAndShelters();
  }, []);

  // Filtrer les donations quand le filtre actif change
  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredDonations(allDonations);
    } else {
      const filtered = allDonations.filter(donation => {
        if (activeFilter === 'shelter') {
          return donation.type === 'shelter';
        }
        // Pour les autres filtres, on peut mapper selon les types de dons
        return donation.type === activeFilter;
      });
      setFilteredDonations(filtered);
    }
  }, [activeFilter, allDonations]);

  if (loading) {
    return (
      <div className={styles.donationContainer}>
        <div className={styles.loadingContainer}>
          <p>Loading donations and shelters...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.donationContainer}>
        <div className={styles.errorContainer}>
          <p className={styles.errorMessage}>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className={styles.retryButton}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.donationContainer}>
      <h1 className={styles.donationTitle}>Animal Shelter Donations</h1>
      
      <div className={styles.quoteContainer}>
        <p className={styles.quote}>&quot;The greatness of a nation can be judged by the way its animals are treated.&quot;</p>
        <p>- Mahatma Gandhi</p>
      </div>

      <div className={styles.statsContainer}>
        <div className={styles.stat}>
          <span className={styles.statNumber}>
            {allDonations.filter(d => d.type !== 'shelter').length}
          </span>
          <span className={styles.statLabel}>Donations</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statNumber}>
            {allDonations.filter(d => d.type === 'shelter').length}
          </span>
          <span className={styles.statLabel}>Shelters</span>
        </div>
      </div>

      <DonationFilter activeFilter={activeFilter} onFilterChange={setActiveFilter} />
      
      {filteredDonations.length === 0 ? (
        <div className={styles.noResults}>
          <p>No {activeFilter === 'all' ? 'donations or shelters' : activeFilter} found.</p>
        </div>
      ) : (
        <DonationCatalog donations={filteredDonations} />
      )}

      {filteredDonations.length > 0 && (
        <div className={styles.viewMoreContainer}>
          <p className={styles.resultCount}>
            Showing {filteredDonations.length} of {allDonations.length} items
          </p>
        </div>
      )}
    </div>
  );
}