 "use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import styles from '../../styles/donations.module.css';


 
const DONATIONS_DATA = [
  {
    id: 'd1',
    title: 'Dog Food Donation',
    description: 'Premium quality dog food for adult dogs. Nutritionally complete and balanced diet for all breeds. Made with real chicken as the main ingredient, this food provides optimal protein levels for muscle maintenance. Contains omega-3 and omega-6 fatty acids for healthy skin and coat. Free from artificial colors, flavors, and preservatives.',
    date: '2025-04-15',
    type: 'food',
    image: 'dog-food.jpg',
    donor: 'Pet Nutrition Inc.',
    quantity: '50 bags (15kg each)'
  },
  {
    id: 'd2',
    title: 'Blankets and Beds',
    description: 'Warm blankets and comfortable beds for cats and dogs. Perfect for shelters during cold months. The blankets are made from soft, durable fleece material that is machine washable. The beds feature orthopedic foam that provides joint support for older animals.',
    date: '2025-04-10',
    type: 'material',
    image: 'blankets.jpg',
    donor: 'Cozy Pets Supply',
    quantity: '30 blankets, 15 beds'
  },
  {
    id: 'd3',
    title: 'Happy Paws Shelter',
    description: 'A shelter dedicated to rescuing abandoned pets and finding them forever homes. We provide temporary housing, medical care, and rehabilitation for animals in need. Our team of volunteers works tirelessly to ensure each animal receives individual attention and care.',
    date: '2025-04-05',
    type: 'shelter',
    address: '123 Animal Lane, Pet City',
    capacity: 50,
    acceptedAnimals: 'Dogs, Cats, Small Mammals',
    image: 'shelter.jpg',
    contact: {
      phone: '(555) 123-4567',
      email: 'info@happypaws.example.com',
      hours: 'Mon-Sat: 9am-5pm, Sun: 10am-3pm'
    }
  },
  {
    id: 'd4',
    title: 'Flea & Tick Medications',
    description: 'Preventative medications for fleas, ticks and other parasites. Suitable for cats and dogs of all sizes. These medications provide month-long protection against parasites that can cause discomfort and disease.',
    date: '2025-04-18',
    type: 'medications',
    image: 'meds.jpg',
    donor: 'VetCare Pharmaceuticals',
    quantity: '100 doses',
    expiryDate: '2026-04-18'
  },
  {
    id: 'd5',
    title: 'Pet Grooming Supplies',
    description: 'High-quality brushes, shampoos, and other grooming tools for animal care. The grooming kit includes brushes suitable for different coat types, gentle shampoo formulated for sensitive skin, nail clippers, and ear cleaning solution.',
    date: '2025-04-12',
    type: 'care-supplies',
    image: 'grooming.jpg',
    donor: 'Glamour Pets',
    quantity: '25 complete grooming kits'
  }
];

export default function DonationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      // Simuler un chargement depuis une API
      setTimeout(() => {
        const foundDonation = DONATIONS_DATA.find(item => item.id === params.id);
        if (foundDonation) {
          setDonation(foundDonation);
        } 
        setLoading(false);
      }, 300);
    }
  }, [params.id]);

  if (loading) {
    return <div className={styles.donationDetailContainer}>Chargement...</div>;
  }

  if (!donation) {
    return (
      <div className={styles.donationDetailContainer}>
        <h2>Donation introuvable</h2>
        <Link href="/donations" className={styles.backButton}>
          ← Retour au catalogue
        </Link>
      </div>
    );
  }

  const formattedType = donation.type.charAt(0).toUpperCase() + donation.type.slice(1).replace('-', ' ');
  const isShelter = donation.type === 'shelter';

  return (
    <div className={styles.donationDetailContainer}>
      <div className={styles.donationDetailHeader}>
        <div className={styles.donationDetailImage}>
          <Image 
            src={`/images/${donation.image}`} 
            alt={donation.title} 
            fill 
            style={{ objectFit: 'cover' }} 
          />
        </div>
      </div>

      <div className={styles.donationDetailInfo}>
        <span className={styles.donationDetailType}>{formattedType}</span>
        <h1 className={styles.donationDetailTitle}>{donation.title}</h1>
        
        <div className={styles.donationDetailDescription}>
          {donation.description}
        </div>

        {isShelter && (
          <div className={styles.shelterInfo}>
            {donation.address && (
              <p className={styles.shelterAddress}>
                <span className={styles.infoLabel}>Address:</span> {donation.address}
              </p>
            )}
            {donation.capacity && (
              <p className={styles.shelterCapacity}>
                <span className={styles.infoLabel}>Capacity:</span> {donation.capacity} animals
              </p>
            )}
            {donation.acceptedAnimals && (
              <p className={styles.shelterAnimals}>
                <span className={styles.infoLabel}>Accepts:</span> {donation.acceptedAnimals}
              </p>
            )}
            {donation.contact && (
              <>
                <p className={styles.shelterContact}>
                  <span className={styles.infoLabel}>Phone:</span> {donation.contact.phone}
                </p>
                <p className={shelterContact}>
                  <span className={styles.infoLabel}>Email:</span> {donation.contact.email}
                </p>
                <p className={styles.shelterContact}>
                  <span className={styles.infoLabel}>Hours:</span> {donation.contact.hours}
                </p>
              </>
            )}
          </div>
        )}

        {!isShelter && donation.donor && (
          <p className={styles.shelterAddress}>
            <span className={styles.info-label}>Donor:</span> {donation.donor}
          </p>
        )}

        {!isShelter && donation.quantity && (
          <p className={styles.shelterAddress}>
            <span className={styles.infoLabel}>Quantity:</span> {donation.quantity}
          </p>
        )}

        {donation.expiryDate && (
          <p className={styles.shelterAddress}>
            <span className={styles.infoLabel}>Expiry Date:</span> {donation.expiryDate}
          </p>
        )}

        <div className={styles.donationMeta}>
          <span className={styles.donationDate}>
            <span className={styles.infoLabel}>Added:</span> {donation.date}
          </span>
        </div>
      </div>

      <Link href="/donations" className={styles.backButton}>
        ← Retour au catalogue
      </Link>
    </div>
  );
}