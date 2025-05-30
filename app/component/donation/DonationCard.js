"use client";

import Image from 'next/image';
import Link from 'next/link';
import styles from '../../styles/donations.module.css';

const DonationCard = ({ donation }) => {
    const { id, title, description, date, type, image } = donation;
    
    const formattedType = type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ');
    const isShelter = type === 'shelter';
    
    return (
        <div className={styles.card}>
            <div className={styles.cardImg}>
                <Image 
                    src={image} 
                    alt={title} 
                    width={300} 
                    height={200} 
                    style={{ objectFit: "cover" }}
                    onError={(e) => {
                        e.target.src = isShelter ? '/images/default-shelter.jpg' : '/images/default-donation.jpg';
                    }}
                />
            </div>
            <div className={styles.cardContent}>
                <div className={styles.cardHeader}>
                    <span className={`${styles.cardType} ${isShelter ? styles.shelterType : styles.donationType}`}>
                        {formattedType}
                    </span>
                    <span className={styles.cardDate}>{date}</span>
                </div>
                
                <h3 className={styles.cardTitle}>{title}</h3>
                <p className={styles.cardDescription}>{description}</p>
                
                {isShelter && (
                    <div className={styles.shelterInfo}>
                        {donation.address && (
                            <p className={styles.shelterAddress}>
                                <span className={styles.infoLabel}>📍 Address:</span> {donation.address}
                            </p>
                        )}
                        {donation.capacity && (
                            <p className={styles.shelterCapacity}>
                                <span className={styles.infoLabel}>🏠 Capacity:</span> {donation.capacity} animals
                            </p>
                        )}
                        {donation.acceptedAnimals && (
                            <p className={styles.shelterAnimals}>
                                <span className={styles.infoLabel}>🐾 Accepts:</span> {donation.acceptedAnimals}
                            </p>
                        )}
                        {donation.contact && (
                            <div className={styles.contactInfo}>
                                {donation.contact.telephone && (
                                    <p className={styles.contactPhone}>
                                        <span className={styles.infoLabel}>📞</span> {donation.contact.telephone}
                                    </p>
                                )}
                                {donation.contact.email && (
                                    <p className={styles.contactEmail}>
                                        <span className={styles.infoLabel}>✉️</span> {donation.contact.email}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                )}

                

                 
                
                <div className={styles.cardActions}>
                    <Link href={`/donations/${id}`} className={styles.viewDetailsLink}>
                        View Details →
                    </Link>
                    {donation.photos && donation.photos.length > 1 && (
                        <span className={styles.photoCount}>
                            📷 {donation.photos.length} photos
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DonationCard;