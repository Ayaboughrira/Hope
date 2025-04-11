'use client'

import React, { useEffect, useState } from 'react';
import { AiFillHeart } from 'react-icons/ai';
import { FaBars, FaUser } from 'react-icons/fa';
import styles from '../styles/navbar.module.css';


const Header = () => {
  // Move initial state to useEffect to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [heartHovered, setHeartHovered] = useState(false);
  const [userPopupOpen, setUserPopupOpen] = useState(false);
  
  // Mark component as mounted on client side
  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    
    // Check initial scroll position
    handleScroll();
    
    // Close popup when clicking outside
    const handleClickOutside = (event) => {
      const userSection = document.querySelector(`.${styles['user-section']}`);
      const userPopup = document.querySelector(`.${userPopupStyles['user-popup']}`);
      
      if (userPopup && 
          (!userSection || !userSection.contains(event.target)) && 
          !userPopup.contains(event.target)) {
        setUserPopupOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleUserClick = () => {
    setUserPopupOpen(!userPopupOpen);
  };

  const redirectToSignup = () => {
    // Navigation to signup/login page
    window.location.href = '/signuplogin';
  };

  // Simple header for server rendering to avoid hydration mismatch
  if (!mounted) {
    return (
      <header className={styles.header}>
        <div className={styles['header-left']}>
          <div className={styles['logo-container']}>
            <span className={styles['logo-placeholder']}>LOGO</span>
          </div>
          <button className={styles['menu-button']}>
            <FaBars className={`${styles.icon} ${styles['menu-icon']}`} />
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
            <div className={styles['dropdown-header']}>
              <span className={styles['dropdown-triangle']}>▼</span>
            </div>
          </div>
          <div className={styles['favorites-section']}>
            <AiFillHeart className={styles['heart-icon']} />
          </div>
          <div className={styles['user-section']}>
            <FaUser className={`${styles.icon} ${styles['user-icon']}`} />
            <span>My Space</span>
          </div>
        </div>
      </header>
    );
  }

  // Full interactive header for client rendering
  return (
    <header className={`${styles.header} ${scrolled ? styles['header-scrolled'] : ''}`}>
      <div className={styles['header-left']}>
        <div className={styles['logo-container']}>
          <span className={styles['logo-placeholder']}>LOGO</span>
        </div>
        <button className={styles['menu-button']}>
          <FaBars className={`${styles.icon} ${styles['menu-icon']}`} />
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
              <li>Shelter</li>
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
        <div className={styles['user-section']} onClick={handleUserClick}>
          <FaUser className={`${styles.icon} ${styles['user-icon']}`} />
          <span>My Space</span>
        </div>
      </div>
      
      { /* User Popup 
       userPopupOpen && (
        <div className={Styles['user-popup']}>
          <div className={Styles['popup-header']}>
            <h3>Welcome</h3>
          </div>
          <div className={Styles['popup-content']}>
            <p>Access your account to manage your preferences</p>
            <button 
              className={Styles['signup-button']} 
              onClick={redirectToSignup}
            >
              Sign up / Login
            </button>
          </div>
        </div>
      )} */
      }
    </header>
  );
};

export default Header;