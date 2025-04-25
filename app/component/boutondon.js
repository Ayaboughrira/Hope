// components/DonateButton.jsx
import React from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import styles from '../styles/boutondon.module.css';

const DonateButton = () => {
  return (
    <div className={styles.donateButtonContainer}>
      <Link href="/" className={styles.donateButton}>
        <Heart className={styles.heartIcon} />
        <span className={styles.buttonText}> Donate </span>
      </Link>
    </div>
  );
};

export default DonateButton;