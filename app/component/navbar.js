'use client'

import React, { useEffect, useState, useRef } from 'react';
import { AiFillHeart } from 'react-icons/ai';
import { FaBars, FaUser, FaTimes } from 'react-icons/fa';
import styles from '../styles/navbar.module.css';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../services/authcontext'; 

const Header = () => {
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [heartHovered, setHeartHovered] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const menuRef = useRef(null);
  const userModalRef = useRef(null);
  const router = useRouter();
  
  // Récupération de l'utilisateur connecté depuis le contexte d'authentification
  const { user, logout } = useAuth();

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
      
      if (userModalRef.current && !userModalRef.current.contains(event.target) &&
          !event.target.closest(`.${styles['user-section']}`)) {
        setUserModalOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Empêcher le défilement du corps lorsque le menu mobile ou modal est ouvert
  useEffect(() => {
    if (mobileMenuOpen || userModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [mobileMenuOpen, userModalOpen]);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const toggleUserModal = () => {
    setUserModalOpen(!userModalOpen);
  };

  const handleLogout = () => {
    logout();
    setUserModalOpen(false);
    router.push('/');
  };

  // Fonction pour obtenir les fonctionnalités spécifiques au type d'utilisateur
  const getUserTypeLinks = () => {
    if (!user) return [];
    
    const commonLinks = [
      { label: 'Mes favoris', href: '/favorites' },
      { label: 'Modifier mon profil', href: `/profile/${user.userType}/${user._id}` },
    ];
    
    switch (user.userType) {
      case 'owner':
        return [
          ...commonLinks,
          { label: 'Mes animaux', href: '/my-pets' },
          { label: 'Mes adoptions', href: '/my-adoptions' }
        ];
      case 'vet':
        return [
          ...commonLinks,
          { label: 'Mes patients', href: '/my-patients' },
          { label: 'Calendrier', href: '/calendar' },
        ];
      case 'association':
        return [
          ...commonLinks,
          { label: 'Gérer les animaux', href: '/manage-animals' },
          { label: 'Demandes d\'adoption', href: '/adoption-requests' },
          { label: 'Événements', href: '/events' }
        ];
      case 'store':
        return [
          ...commonLinks,
          { label: 'Gérer les produits', href: '/manage-products' },
          { label: 'Promotions', href: '/promotions' },
          { label: 'Commandes', href: '/orders' }
        ];
      default:
        return commonLinks;
    }
  };

  return (
    <header className={`${styles.header} ${scrolled ? styles['header-scrolled'] : ''}`}>
      <div className={styles['header-left']}>
        <Link href="/" className={styles['logo-container']}>
          <span className={styles['logo-placeholder']}>LOGO</span>
        </Link>
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
            <li><Link href="/report">Report</Link></li>
            <li><Link href="/donate">Donate</Link></li>
            <li><Link href="/advertise">Advertise Animal for Adoption</Link></li>
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
              <li><Link href="/directory/veterinarian">Veterinarian</Link></li>
              <li><Link href="/directory/association">Association</Link></li>
              <li><Link href="/directory/store">Pet Store</Link></li>
            </ul>
          )}
        </div>
        <Link href={user ? "/favorites" : "/signuplogin"} className={styles['favorites-section']}>
          <div 
            onMouseEnter={() => setHeartHovered(true)}
            onMouseLeave={() => setHeartHovered(false)}
          >
            <AiFillHeart className={`${styles['heart-icon']} ${heartHovered ? styles['heart-hovered'] : ''}`} />
          </div>
        </Link>
        <div 
          className={styles['user-section']} 
          onClick={user ? toggleUserModal : () => router.push('/signuplogin')}
        >
          <FaUser className={`${styles.icon} ${styles['user-icon']}`} />
          <span>{user ? 'My Space' : 'Connexion'}</span>
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
                  <Link href="/" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
                    Home
                  </Link>
                </li>
                <li>
                  <Link href="/catalogueanimal" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
                    Adopt
                  </Link>
                </li>
                <li>
                  <Link href="/donate" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
                    Donate Catalogue
                  </Link>
                </li>
                <li>
                  <Link href="/advertise" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
                    Advertise Animal for Adoption
                  </Link>
                </li>
                {user && (
                  <li>
                    <Link 
                      href={`/profile/${user.userType}/${user._id}`} 
                      className={styles.mobileNavLink} 
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Mon profil
                    </Link>
                  </li>
                )}
                <li>
                  <Link href="/catalogueproduit" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
                    Special Offers
                  </Link>
                </li>
                <li>
                  <Link href="/favorites" className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
                    Favorites
                  </Link>
                </li>
                
                {/* Afficher les fonctionnalités supplémentaires en fonction du type d'utilisateur */}
                {user && getUserTypeLinks().map((link, index) => (
                  <li key={index}>
                    <Link href={link.href} className={styles.mobileNavLink} onClick={() => setMobileMenuOpen(false)}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className={styles.mobileMenuButtons}>
              {!user ? (
                <>
                  <Link href="/signuplogin" className={styles.mobileMenuButton} onClick={() => setMobileMenuOpen(false)}>
                    Login
                  </Link>
                  <Link href="/signuplogin" className={`${styles.mobileMenuButton} ${styles.primary}`} onClick={() => setMobileMenuOpen(false)}>
                    Sign Up
                  </Link>
                </>
              ) : (
                <button onClick={handleLogout} className={`${styles.mobileMenuButton} ${styles.primary}`}>
                  Déconnexion
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Modal pour My Space */}
      {userModalOpen && user && (
        <div className={styles.userModalOverlay}>
          <div 
            ref={userModalRef}
            className={styles.userModal}
          >
            <div className={styles.userModalHeader}>
              <h3>Mon espace {user.userType === 'vet' ? 'Vétérinaire' : 
                            user.userType === 'association' ? 'Association' : 
                            user.userType === 'store' ? 'Animalerie' : 
                            'Utilisateur'}</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setUserModalOpen(false)}
                aria-label="Fermer"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className={styles.userModalContent}>
              <div className={styles.userInfo}>
                <div className={styles.userAvatar}>
                  <FaUser size={50} />
                </div>
                <div className={styles.userDetails}>
                  <h4>{user.nom} {user.prenom}</h4>
                  <p>{user.email}</p>
                </div>
              </div>
              
              <ul className={styles.userLinks}>
                {getUserTypeLinks().map((link, index) => (
                  <li key={index}>
                    <Link 
                      href={link.href} 
                      className={styles.userLink}
                      onClick={() => setUserModalOpen(false)}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              
              <div className={styles.userModalFooter}>
                <button 
                  onClick={handleLogout}
                  className={styles.logoutButton}
                >
                  Déconnexion
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;