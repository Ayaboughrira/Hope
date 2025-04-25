import React from 'react';
import  styles from '../styles/footer.module.css';
import Link from  'next/link';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      
      <div className={styles.footercontent}>
        <div className={styles.footersection}>
          <h3>About Us</h3>
          <p>We help connect animals in need with loving homes and provide resources for animal shelters.</p>
        </div>
        
        <div className={styles.footersection}>
          <h3>Quick Links</h3>
          <ul>
            <li><a href="/catalogueanimal">Adoption Process</a></li>
            <li><a href="#">Success Stories</a></li>
            <li><a href="#">Animal Care Tips</a></li>
            <li><a href="#">Donation</a></li>
          </ul>
        </div>
        
        <div className={styles.footersection}>
          <h3>Contact Us</h3>
          <p><i className={styles.icon}>📧</i> info@petadoption.com</p>
          <p><i className={styles.icon}>📱</i> +213 781092134</p>
          <p><i className={styles.icon}>📍</i> Algeria</p>
        </div>
        
        <div className={styles.footersection}>
          <h3>Join Us</h3>
          <Link  href="/signuplogin" className={styles.signupbtn}>Sign Up</Link>
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
          <a href="#">FAQ</a>
          <a href="#">Privacy Policy</a>
          <a href="#">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;