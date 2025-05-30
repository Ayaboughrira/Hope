"use client";
import { useState, useEffect } from 'react';
import styles from '../../styles/donations.module.css';

const DonationFilter = ({ activeFilter, onFilterChange }) => {
    const [donationTypes, setDonationTypes] = useState([]);
    const [loading, setLoading] = useState(true);

    // Charger les types de dons depuis l'API
    useEffect(() => {
        const fetchDonationTypes = async () => {
            try {
                const response = await fetch('/api/type');
                const result = await response.json();
                
                if (result.success) {
                    setDonationTypes(result.data);
                }
            } catch (error) {
                console.error('Erreur lors du chargement des types:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDonationTypes();
    }, []);

    // Filtres de base + types dynamiques
    const baseFilters = [
        { id: 'all', label: 'All Donations', icon: '🎁' },
        { id: 'shelter', label: 'Shelters', icon: '🏠' }
    ];

    // Créer les filtres dynamiques basés sur les types de dons
    const dynamicFilters = donationTypes.map(type => ({
        id: type.nomType.toLowerCase(),
        label: type.nomType,
        icon: getIconForType(type.nomType)
    }));

    const allFilters = [...baseFilters, ...dynamicFilters];

    function getIconForType(typeName) {
        const typeIcons = {
            'food': '🍖',
            'nourriture': '🍖',
            'material': '🧸',
            'matériel': '🧸',
            'medications': '💊',
            'médicaments': '💊',
            'care-supplies': '🧴',
            'soins': '🧴',
            'toys': '🎾',
            'jouets': '🎾',
            'accessories': '🎀',
            'accessoires': '🎀'
        };
        
        return typeIcons[typeName.toLowerCase()] || '📦';
    }
  
    if (loading) {
        return (
            <div className={styles.filterContainer}>
                <div className={styles.filterLoading}>Loading filters...</div>
            </div>
        );
    }

    return (
        <div className={styles.filterContainer}>
            <div className={styles.filterHeader}>
                <h3>Filter by Category</h3>
            </div>
            <div className={styles.filterButtons}>
                {allFilters.map(filter => (
                    <button 
                        key={filter.id}
                        className={`${styles.filterBtn} ${activeFilter === filter.id ? styles.active : ''}`}
                        onClick={() => onFilterChange(filter.id)}
                    >
                        <span className={styles.filterIcon}>{filter.icon}</span>
                        <span className={styles.filterLabel}>{filter.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default DonationFilter;