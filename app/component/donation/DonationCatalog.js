 "use client";

import DonationCard from './DonationCard';
import styles from '../../styles/donations.module.css';

const DonationCatalog = ({ donations }) => {
    return (
        <div className={styles.catalog}>
            {donations.map(donation => (
                <DonationCard key={donation.id} donation={donation} />
            ))}
        </div>
    );
};

export default DonationCatalog;