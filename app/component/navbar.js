'use client'

import React, { useEffect, useState, useRef } from 'react';
import { AiFillHeart } from 'react-icons/ai';
import { FaBars, FaUser, FaTimes } from 'react-icons/fa';
import styles from '../styles/navbar.module.css';
import Link from  'next/link';


const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [heartHovered, setHeartHovered] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef(null);
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    // Gérer les clics en dehors du menu pour le fermer
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && 
          !event.target.classList.contains(styles['menu-button'])) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Empêcher le défilement du corps lorsque le menu mobile est ouvert
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [mobileMenuOpen]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className={`${styles.header} ${scrolled ? styles['header-scrolled'] : ''}`}>
      <div className={styles['header-left']}>
        <div className={styles['logo-container']}>
          <span className={styles['logo-placeholder']}>LOGO</span>
        </div>
        <button 
          className={styles['menu-button']} 
          onClick={toggleMobileMenu}
          aria-expanded={mobileMenuOpen}
          aria-label="Menu principal"
        >
          {mobileMenuOpen ? (
            <FaTimes className={`${styles.icon} ${styles['menu-icon']}`} />
          ) : (
            <FaBars className={`${styles.icon} ${styles['menu-icon']}`} />
          )}
        </button>
      </div>
      
      <div className={styles['header-center']}>
        <nav className={styles['main-nav']}>
          <ul>
            <li><a href="#">Report</a></li>
            <li><a href="#">Donate</a></li>
            <li><a href="#">Advertise Animal for Adoption</a></li>
          </ul>
        </nav>
      </div>
      
      <div className={styles['header-right']}>
        <div className={styles['dropdown-container']}>
          <div 
            className={styles['dropdown-header']} 
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <span className={`${styles['dropdown-triangle']} ${dropdownOpen ? styles.open : ''}`}>▼</span>
          </div>
          {dropdownOpen && (
            <ul className={styles['dropdown-menu']}>
              <li>Veterinarian</li>
              <li>Association</li>
              <li>Pet Shop</li>
            </ul>
          )}
        </div>
        <div 
          className={styles['favorites-section']}
          onMouseEnter={() => setHeartHovered(true)}
          onMouseLeave={() => setHeartHovered(false)}
        >
          <AiFillHeart className={`${styles['heart-icon']} ${heartHovered ? styles['heart-hovered'] : ''}`} />
        </div>
        <div className={styles['user-section']}>
          <FaUser className={`${styles.icon} ${styles['user-icon']}`} />
          <span>My Space</span>
        </div>
      </div>

      {/* Menu mobile déroulant vertical */}
      {mobileMenuOpen && (
        <div className={styles.mobileMenuOverlay}>
          <div 
            ref={menuRef}
            className={styles.mobileMenu}
          >
            <div className={styles.mobileMenuHeader}>
              <span className={styles.mobileMenuTitle}>Menu</span>
              <button 
                className={styles.closeButton}
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Fermer le menu"
              >
                <FaTimes />
              </button>
            </div>
            <nav className={styles.mobileNavigation}>
              <ul>
                <li>
                  <a href="/" className={styles.mobileNavLink}>Home</a>
                </li>
                <li>
                  <a href="/catalogueanimal" className={styles.mobileNavLink}>Adopt</a>
                </li>
                <li>
                  <a href="#" className={styles.mobileNavLink}>Donate Catalogue</a>
                </li>
                <li>
                  <a href="#" className={styles.mobileNavLink}>Advertise Animal for Adoption</a>
                </li>
                <li>
                  <a href="#" className={styles.mobileNavLink}>My profil</a>
                </li>
                <li>
                  <a href="/catalogueproduit" className={styles.mobileNavLink}>Special Offers</a>
                </li>
                <li>
                  <a href="#" className={styles.mobileNavLink}>Favorites</a>
                </li>
              </ul>
            </nav>
            <div className={styles.mobileMenuButtons}>
              <Link href="/signuplogin" className={styles.mobileMenuButton}>
                Login
              </Link>
              <Link href="/signuplogin" className={`${styles.mobileMenuButton} ${styles.primary}`}>
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;