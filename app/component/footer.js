import React from 'react';
import styles from '../styles/footer.module.css';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      
      <div className={styles.footercontent}>
        <div className={styles.footersection}>
          <Link href="/aboutus" className={styles.aboutLink}>
            <h3>About Us</h3>
          </Link>
          <p> We help connect animals in need with loving homes and provide resources for animal shelters.</p>
        </div>
        
        <div className={styles.footersection}>
          <h3>Quick Links</h3>
          <ul>
            <li><Link href="/catalogueanimal">Adoption Process</Link></li>
            <li><Link href="/">Success Stories</Link></li>
            <li><Link href="/">Animal Care Tips</Link></li>
            <li><Link href="/Donations">Donation</Link></li>
          </ul>
        </div>
        
        <div className={styles.footersection}>
          <h3>Contact Us</h3>
          <p><i className={styles.icon}>📧</i> hope65622@gmail.com</p>
          <p><i className={styles.icon}>📱</i> +213 666666666</p>
          <p><i className={styles.icon}>📍</i> Algeria</p>
        </div>
        
        <div className={styles.footersection}>
          <h3>Join Us</h3>
          <Link href="/signuplogin" className={styles.signupbtn}>
            Sign Up
          </Link>
          <div className={styles.socialicons}>
            <a href="#" className={styles.socialicon}>FB</a>
            <a href="#" className={styles.socialicon}>IG</a>
            <a href="#" className={styles.socialicon}>TW</a>
          </div>
        </div>
      </div>
      
      <div className={styles.footerbottom}>
        <p>&copy; 2025 Pet Adoption Platform. All rights reserved.</p>
        <div className={styles.footerlinks}>
          <Link href="/">FAQ</Link>
          <Link href="/">Privacy Policy</Link>
          <Link href="/">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;