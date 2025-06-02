'use client'

import { signOut, useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import {
  FaBars, // Pour Report (plus expressif)
  FaBullhorn, // Pour Admin
  FaCog, // Pour Rescue campaigns
  FaCrown, // Pour Donate (plus expressif)
  FaExclamationTriangle, FaHandHoldingHeart, // Pour articles
  FaHeadphones, FaHeart, FaHome, FaMapMarkerAlt, // Pour vétérinaire
  FaNewspaper, FaPaw, // Pour campagnes
  FaShieldAlt, FaStethoscope, FaStore, FaTimes, FaUser, // Pour Post your Pet
  FaUsers, // Pour Dashboard
  FaUsersCog // Pour Manage Users
} from 'react-icons/fa';
import { isAdminClient } from '../config/adminconfig-client';
import styles from '../styles/navbar.module.css';

const Navbar = () => {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';
  const isUserAdmin = session?.user?.email ? isAdminClient(session.user.email) : false;
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userModalRef = useRef(null);
  const sidebarRef = useRef(null);
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const locationDropdownRef = useRef(null);


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
    if (locationDropdownRef.current && !locationDropdownRef.current.contains(event.target)) {
      setLocationDropdownOpen(false);
    }
    };

    document.addEventListener('mousedown', handleClickOutside);
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, []);
     const toggleLocationDropdown = () => {
  setLocationDropdownOpen(!locationDropdownOpen);
};
const handleServiceNavigation = (serviceType) => {
  setLocationDropdownOpen(false);
  // Utiliser router.push avec query params pour passer le type de service
  window.location.href = `/ServiceLocator?filter=${serviceType}`;
};




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
      { label: 'My Account', href: `/profile/${session.user.userType}/${session.user.id}`, icon: <FaUser /> },
    ];
    
    // Add admin links if user is admin
    const adminLinks = isUserAdmin ? [
      { label: 'Admin Dashboard', href: '/admin', icon: <FaCog />, isAdmin: true },
    ] : [];
    
    let userTypeLinks = [];
    
    switch (session.user.userType) {
      case 'owner':
        userTypeLinks = [
          { label: 'My favorites', href: '/favoritepets', icon: <FaHeart /> },
          { label: 'My Adoption Request', href: '/mesdemandeadoption', icon: <FaHandHoldingHeart /> },
          { label: 'My animals', href: '/mesanimaux', icon: <FaHeart /> },
          { label: 'Manage Adoption', href: '/adoptiondemande', icon: <FaPaw /> },
        ];
        break;

      case 'vet':
        userTypeLinks = [
          { label: 'Publish Articles', href: '/articleform', icon: <FaNewspaper /> },
          { label: 'My Adoption Request', href: '/mesdemandeadoption', icon: <FaHandHoldingHeart /> },
          { label: 'My animals', href: '/mesanimaux', icon: <FaPaw/> },
          {label: 'My favorites', href: '/favoritepets', icon: <FaHeart /> },
          { label: 'Manage Adoption', href: '/adoptiondemande', icon: <FaPaw /> }
        ];
        break;
        
      case 'association':
        userTypeLinks = [
          { label: ' Annonce a compaign', href: '/compagneform', icon: <FaHeadphones/> },
          { label: 'Publish Articles', href: '/articleform', icon: <FaNewspaper /> },
          { label: 'Abuse Reports', href: '/', icon: <FaShieldAlt /> },
          { label: 'My Adoption Request', href: '/mesdemandeadoption', icon: <FaHandHoldingHeart /> },
          { label: 'My animals', href: '/mesanimaux', icon: <FaPaw /> },
          { label: 'My favorites', href: '/favoritepets', icon: <FaHeart /> },
          { label: 'Manage Adoption', href: '/adoptiondemande', icon: <FaPaw /> }
        ];
        break;
        
      case 'store':
        userTypeLinks = [
          { label: 'Publish products', href: '/annoncerproduit', icon: <FaStore /> },
          { label: 'My Adoption Request', href: '/mesdemandeadoption', icon: <FaHandHoldingHeart /> },
          { label: 'My animals', href: '/mesanimaux', icon: <FaPaw /> },
          { label: 'My favorites', href: '/favoritepets', icon: <FaHeart /> },
          { label: 'Manage Adoption', href: '/adoptiondemande', icon: <FaPaw /> }
        ];
        break;
        
      default:
        userTypeLinks = [];
    }
    
    return [...commonLinks, ...userTypeLinks, ...adminLinks];
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
              <Image
                src="/images/logo1.png" 
                alt="Pet Adoption Logo"
                width={150}
                height={50}
                className={styles.logoImage}
                priority
              />
            </div>  
          </Link>
          <div className={styles.links}>
            <Link href="/" className={styles.link}>
              <FaHome className={styles.linkIcon} />
              <span>Home</span>
            </Link>
            <Link href="/DisappearancesReport" className={styles.link}>
              <FaExclamationTriangle className={styles.linkIcon} />
              <span>Report</span>
            </Link>
            <Link href="/Donations" className={styles.link}>
              <FaHandHoldingHeart className={styles.linkIcon} />
              <span>Donation</span>
            </Link>
            <Link href="/annonceanimal" className={styles.link}>
              <FaBullhorn className={styles.linkIcon} />
              <span>Advertise Animal for Adoption</span>
            </Link>
          </div>
        </div>

        {/* Boutons d'authentification */}
        <div className={styles.authSection}>
          {/* Icône de localisation */}
  <div className={styles.locationContainer} ref={locationDropdownRef}>
    <button 
      onClick={toggleLocationDropdown} 
      className={styles.locationButton}
      aria-expanded={locationDropdownOpen}
      aria-label="Find Services"
    >
      <FaMapMarkerAlt className={styles.locationIcon} />
    </button>
    
    {locationDropdownOpen && (
      <div className={styles.locationDropdown}>
        <button 
          onClick={() => handleServiceNavigation('association')}
          className={styles.locationDropdownItem}
        >
          <FaUsers className={styles.dropdownIcon} />
          <span>Associations</span>
        </button>
        <button 
          onClick={() => handleServiceNavigation('petshop')}
          className={styles.locationDropdownItem}
        >
          <FaStore className={styles.dropdownIcon} />
          <span>Pet Stores</span>
        </button>
        <button 
          onClick={() => handleServiceNavigation('veterinarian')}
          className={styles.locationDropdownItem}
        >
          <FaStethoscope className={styles.dropdownIcon} />
          <span>Veterinarians</span>
        </button>
      </div>
    )}
  </div>
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
                    <div className={styles.userNameContainer}>
                      <h4>{session.user.name}</h4>
                      {isUserAdmin && <FaCrown className={styles.adminIcon} />}
                    </div>
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
                    <Link href="/report" className={styles.sidebarLink} onClick={() => setMobileMenuOpen(false)}>
                      <FaExclamationTriangle className={styles.sidebarLinkIcon} />
                      <span>Report to protect animals</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/Donform" className={styles.sidebarLink} onClick={() => setMobileMenuOpen(false)}>
                      <FaHandHoldingHeart className={styles.sidebarLinkIcon} />
                      <span>Donate for animals</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/annonceanimal" className={styles.sidebarLink} onClick={() => setMobileMenuOpen(false)}>
                      <FaBullhorn className={styles.sidebarLinkIcon} />
                      <span>Advertise Animal for Adoption</span>
                    </Link>
                  </li>
                  
                  <li>
                    <Link href="/cataloguecompagne" className={styles.sidebarLink} onClick={() => setMobileMenuOpen(false)}>
                      <FaUsers className={styles.sidebarLinkIcon} />
                      <span>Rescue campaigns </span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/catalogueproduit" className={styles.sidebarLink} onClick={() => setMobileMenuOpen(false)}>
                      <FaUsers className={styles.sidebarLinkIcon} />
                      <span>Specials Offers</span>
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
                      <div className={styles.mySpaceScrollContainer}>
                        {getUserTypeLinks().filter(link => !link.isAdmin).map((link, index) => (
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
                      </div>
                      
                      {/* Admin Section in Sidebar */}
                      {isUserAdmin && (
                        <>
                          <li className={styles.sidebarDivider}>
                            <span className={styles.adminSectionTitle}>
                              <FaCrown className={styles.adminSectionIcon} />
                              Admin Panel
                            </span>
                          </li>
                          <div className={styles.adminScrollContainer}>
                            <li>
                              <Link 
                                href="/admin" 
                                className={`${styles.sidebarLink} ${styles.adminLink}`}
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                <FaCog className={styles.adminLinkIcon} />
                                <span>Dashboard</span>
                              </Link>
                            </li>
                            <li>
                              <Link 
                                href="/admin/users" 
                                className={`${styles.sidebarLink} ${styles.adminLink}`}
                                onClick={() => setMobileMenuOpen(false)}
                              >
                                <FaUsersCog className={styles.adminLinkIcon} />
                                <span>Manage Users</span>
                              </Link>
                            </li>
                          </div>
                        </>
                      )}
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
            <div className={`${styles.userModalHeader} ${isUserAdmin ? styles.adminModalHeader : ''}`}>
              <h3>{isUserAdmin ? 'Admin' : `My Space ${session.user.userType === 'vet' ? 'Veterinarian' : 
              session.user.userType === 'association' ? 'Association' : 
              session.user.userType === 'store' ? 'Pet Store' : 
              'Pet Owner'}`}</h3>
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
                <div className={`${styles.userAvatar} ${isUserAdmin ? styles.adminAvatar : ''}`}>
                  <FaUser size={32} />
                </div>
                <div className={styles.userDetails}>
                  <div className={styles.userNameContainer}>
                    <h4>{session.user.name}</h4>
                    {isUserAdmin && <FaCrown className={styles.adminIconModal} />}
                  </div>
                  <p>{session.user.email}</p>
                  {isUserAdmin && <span className={styles.adminBadge}>Administrator</span>}
                </div>
              </div>
              
              <div className={styles.userLinksScrollContainer}>
                <ul className={styles.userLinks}>
                  {getUserTypeLinks().filter(link => !link.isAdmin).map((link, index) => (
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
                  
                  {/* Admin Links in Modal */}
                  {isUserAdmin && (
                    <li>
                      <Link 
                        href="/admin" 
                        className={`${styles.userLink} ${styles.adminUserLink}`}
                        onClick={() => setUserModalOpen(false)}
                      >
                        <FaCog />
                        <span>Admin Dashboard</span>
                      </Link>
                    </li>
                  )}
                </ul>
              </div>
              
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