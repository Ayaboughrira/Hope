import styles from '../styles/sectionfour.module.css';
import Image from 'next/image';
import Link from 'next/link'; // Import the Link component

const HomeDonationRefuge = () => {
  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.textContainer}>
            <h2 className={styles.title}>
              <span className={styles.highlight}>Support</span> Our Animals
            </h2>
            <p className={styles.description}>
              Your generosity helps rescue abandoned animals and provide them with safe shelter while they wait for their forever homes. 
              Every contribution makes a difference.
            </p>
            <div className={styles.buttons}>
              {/* First button with Link */}
              <Link href="/Donations" passHref legacyBehavior>
                <a className={styles.donateButton}>
                  View more Donations
                  
                </a>
              </Link>
              
              {/* Second button with Link */}
              <Link href="/Donform" passHref legacyBehavior>
                <a className={styles.refugeButton}>
                  Make a Donation
                  
                </a>
              </Link>
            </div>
          </div>
          <div className={styles.imageContainer}>
            <Image
              src="/images/don1.jpg"
              alt="don refuge"
              fill
              className={styles.image}
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HomeDonationRefuge;