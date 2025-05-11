'use client'

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { FaUser, FaTimes, FaHome, FaInfoCircle, FaEnvelope, FaTools, FaBars, FaHeart, FaCalendarAlt, FaPaw, FaShoppingCart, FaStore, FaHandHoldingHeart } from 'react-icons/fa';
import styles from '../styles/navbar.module.css';

const Navbar = () => {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userModalRef = useRef(null);
  const sidebarRef = useRef(null);

  useEffect(() => {
    // Gérer le défilement pour changer l'apparence du navbar
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
    // Gérer les clics en dehors du modal et du menu latéral pour les fermer
    const handleClickOutside = (event) => {
      if (userModalRef.current && !userModalRef.current.contains(event.target) &&
          !event.target.closest(`.${styles.userButton}`)) {
        setUserModalOpen(false);
      }
      
      if (sidebarRef.current && !sidebarRef.current.contains(event.target) &&
          !event.target.closest(`.${styles.menuButton}`)) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Empêcher le défilement du corps lorsque le modal ou le menu latéral est ouvert
  useEffect(() => {
    if (userModalOpen || mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [userModalOpen, mobileMenuOpen]);

  const toggleUserModal = () => {
    setUserModalOpen(!userModalOpen);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleLogout = () => {
    signOut({ callbackUrl: '/' });
    setUserModalOpen(false);
    setMobileMenuOpen(false);
  };

  // Fonction pour obtenir les fonctionnalités spécifiques au type d'utilisateur
  const getUserTypeLinks = () => {
    if (!session?.user) return [];
    
    const commonLinks = [
      { label: 'My favorites', href: '/favorites', icon: <FaHeart /> },
      { label: 'Edit my profil', href: `/profile/${session.user.userType}/${session.user.id}`, icon: <FaUser /> },
    ];
    
    switch (session.user.userType) {
      case 'owner':
        return [
          ...commonLinks,
          { label: 'My pets', href: '/my-pets', icon: <FaPaw /> },
          { label: 'Mes adoptions', href: '/my-adoptions', icon: <FaHandHoldingHeart /> }
        ];
      case 'vet':
        return [
          ...commonLinks,
          { label: 'Mes patients', href: '/my-patients', icon: <FaPaw /> },
          { label: 'Calendrier', href: '/calendar', icon: <FaCalendarAlt /> },
        ];
      case 'association':
        return [
          ...commonLinks,
          { label: 'Gérer les animaux', href: '/manage-animals', icon: <FaPaw /> },
          { label: 'Demandes d\'adoption', href: '/adoption-requests', icon: <FaHandHoldingHeart /> },
          { label: 'Événements', href: '/events', icon: <FaCalendarAlt /> }
        ];
      case 'store':
        return [
          ...commonLinks,
          { label: 'Publish products', href: '/annoncerproduit', icon: <FaStore /> },
          { label: 'Promotions', href: '/promotions', icon: <FaShoppingCart /> },
          { label: 'Commandes', href: '/orders', icon: <FaShoppingCart /> }
        ];
      default:
        return commonLinks;
    }
  };

  return (
    <header className={`${styles.navbar} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles.container}>
        {/* Bouton du menu hamburger */}
        <button 
          className={styles.menuButton} 
          onClick={toggleMobileMenu}
          aria-expanded={mobileMenuOpen}
          aria-label="Main Menu"
        >
          {mobileMenuOpen ? (
            <FaTimes className={styles.menuIcon} />
          ) : (
            <FaBars className={styles.menuIcon} />
          )}
        </button>
        
        {/* Logo et liens */}
        <div className={styles.logoSection}>
          <Link href="/" className={styles.logoWrapper}>
            <div className={styles.logo}>
              {/* Emplacement pour votre logo */}
              <div className={styles.logoPlaceholder}>LOGO</div>
            </div>
          </Link>
          <div className={styles.links}>
            <Link href="/" className={styles.link}>
              <FaHome className={styles.linkIcon} />
              <span>Home</span>
            </Link>
            <Link href="/Report" className={styles.link}>
              <FaTools className={styles.linkIcon} />
              <span>Report</span>
            </Link>
            <Link href="/cataloguedon" className={styles.link}>
              <FaInfoCircle className={styles.linkIcon} />
              <span>Donate</span>
            </Link>
            <Link href="/" className={styles.link}>
              <FaEnvelope className={styles.linkIcon} />
              <span>Advertise Animal for Adoption</span>
            </Link>
          </div>
        </div>

        {/* Boutons d'authentification */}
        <div className={styles.authSection}>
          {isAuthenticated ? (
            <>
              <button onClick={toggleUserModal} className={styles.userButton}>
                <FaUser className={styles.userIcon} />
                <span>My Space</span>
              </button>
              <button
                onClick={handleLogout}
                className={styles.logoutButton}
              >
               Log out
              </button>
            </>
          ) : (
            <Link href="/signuplogin" className={styles.authButton}>
             Sign up
            </Link>
          )}
        </div>
      </div>
      
      {/* Menu latéral en dehors du header */}
      {mobileMenuOpen && (
        <div className={styles.sidebarOverlay}>
          <div 
            ref={sidebarRef}
            className={styles.sidebar}
          >
            <div className={styles.sidebarHeader}>
              <h3>Menu</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close the Menu"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className={styles.sidebarContent}>
              {isAuthenticated && (
                <div className={styles.userInfo}>
                  <div className={styles.userAvatar}>
                    <FaUser size={32} />
                  </div>
                  <div className={styles.userDetails}>
                    <h4>{session.user.name}</h4>
                    <p>{session.user.email}</p>
                  </div>
                </div>
              )}
              
              <nav className={styles.sidebarNav}>
                <ul className={styles.sidebarLinks}>
                  <li>
                    <Link href="/" className={styles.sidebarLink} onClick={() => setMobileMenuOpen(false)}>
                      <FaHome className={styles.sidebarLinkIcon} />
                      <span>Home</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/" className={styles.sidebarLink} onClick={() => setMobileMenuOpen(false)}>
                      <FaTools className={styles.sidebarLinkIcon} />
                      <span>Report</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/" className={styles.sidebarLink} onClick={() => setMobileMenuOpen(false)}>
                      <FaInfoCircle className={styles.sidebarLinkIcon} />
                      <span>Donate</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/" className={styles.sidebarLink} onClick={() => setMobileMenuOpen(false)}>
                      <FaEnvelope className={styles.sidebarLinkIcon} />
                      <span>Advertise Animal for Adoption</span>
                    </Link>
                  </li>
                  
                  {/* Fonctionnalités spécifiques au type d'utilisateur */}
                  {isAuthenticated && (
                    <>
                      <li className={styles.sidebarDivider}>
                        <span>My Space {session.user.userType === 'vet' ? 'Veterinarian' : 
                                        session.user.userType === 'association' ? 'Asociation' : 
                                        session.user.userType === 'store' ? 'Pet Store' : 
                                        'Pet Owner' }</span>
                      </li>
                      {getUserTypeLinks().map((link, index) => (
                        <li key={index}>
                          <Link 
                            href={link.href} 
                            className={styles.sidebarLink}
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {link.icon}
                            <span>{link.label}</span>
                          </Link>
                        </li>
                      ))}
                    </>
                  )}
                </ul>
              </nav>
              
              <div className={styles.sidebarFooter}>
                {isAuthenticated ? (
                  <button 
                    onClick={handleLogout}
                    className={styles.sidebarLogoutButton}
                  >
                   Log out
                  </button>
                ) : (
                  <div className={styles.sidebarAuthButtons}>
                    <Link 
                      href="/signuplogin" 
                      className={styles.sidebarAuthButton}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sign up
                    </Link>
                    
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour Mon Espace */}
      {userModalOpen && session?.user && (
        <div className={styles.userModalOverlay}>
          <div 
            ref={userModalRef}
            className={styles.userModal}
          >
            <div className={styles.userModalHeader}>
              <h3>My Space {session.user.userType === 'vet' ? 'Veterinarian' : 
                            session.user.userType === 'association' ? 'Association' : 
                            session.user.userType === 'store' ? 'Pet Store' : 
                            'Pet Owner'}</h3>
              <button 
                className={styles.closeButton}
                onClick={() => setUserModalOpen(false)}
                aria-label="Close"
              >
                <FaTimes />
              </button>
            </div>
            
            <div className={styles.userModalContent}>
              <div className={styles.userInfo}>
                <div className={styles.userAvatar}>
                  <FaUser size={32} />
                </div>
                <div className={styles.userDetails}>
                  <h4>{session.user.name}</h4>
                  <p>{session.user.email}</p>
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
                      {link.icon}
                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              
              <div className={styles.userModalFooter}>
                <button 
                  onClick={handleLogout}
                  className={styles.logoutButton}
                >
                  Log out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;