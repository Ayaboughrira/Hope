'use client'
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../styles/mesdemandeadoption.module.css';

const MyAdoptionRequests = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  
  useEffect(() => {
    // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
    if (status === 'unauthenticated') {
      router.push('/signuplogin?callbackUrl=/mesdemandeadoption');
      return;
    }
    
    // Si le chargement de la session est terminé et que l'utilisateur est connecté
    if (status === 'authenticated') {
      fetchMyRequests(activeTab);
    }
  }, [status, activeTab, router]);
  
  const fetchMyRequests = async (statusFilter) => {
    try {
      setLoading(true);
      
      // Utiliser un paramètre différent pour distinguer les demandes du demandeur
      const response = await fetch(`/api/mesdemandeadoption?status=${statusFilter}`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const { success, data } = await response.json();
      
      if (success) {
        setRequests(data);
      } else {
        throw new Error('Échec du chargement de vos demandes');
      }
    } catch (error) {
      console.error('Erreur lors du chargement de vos demandes:', error);
      setError(`Impossible de charger vos demandes: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  // Formatter une date pour l'affichage
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };
  
  // Fonction pour obtenir le texte du statut en français
  const getStatusText = (status) => {
    switch(status) {
      case 'pending': return 'Pending';
      case 'accepted': return 'Accepted';
      case 'rejected': return 'Rejected';
      default: return status;
    }
  };
  
  // Fonction pour obtenir la couleur du statut
  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return '#ffa500';
      case 'accepted': return '#28a745';
      case 'rejected': return '#dc3545';
      default: return '#6c757d';
    }
  };
  
  // Si la session est en cours de chargement
  if (status === 'loading') {
    return <div className={styles.loading}>Loading...</div>;
  }
  
  // Si l'utilisateur n'est pas connecté, ne rien afficher
  if (status === 'unauthenticated') {
    return null;
  }
  
  return (
    <div className={styles.myRequestsContainer}>
      <h1 className={styles.pageTitle}>My adoption requests</h1>
      <p className={styles.subtitle}>Follow the status of all your adoption requests.</p>
      
      <div className={styles.tabsContainer}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'all' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('all')}
        >
          All ({requests.length})
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'pending' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('pending')}
        >
         Pending
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'accepted' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('accepted')}
        >
          Accepted
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'rejected' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('rejected')}
        >
          Rejected
        </button>
      </div>
      
      {loading ? (
        <div className={styles.loading}>Loading your requests...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : requests.length === 0 ? (
        <div className={styles.emptyState}>
          <h3>No requests found</h3>
          <p>
            {activeTab === 'all' 
              ? "Vous n'avez pas encore envoyé de demande d'adoption." 
              : `Aucune demande ${getStatusText(activeTab).toLowerCase()}.`
            }
          </p>
          <Link href="/catalogueanimal" className={styles.browseAnimalsLink}>
            Browse available animals
          </Link>
        </div>
      ) : (
        <div className={styles.requestsList}>
          {requests.map((request) => (
            <div key={request._id} className={styles.requestCard}>
              <div className={styles.requestHeader}>
                <div className={styles.animalInfo}>
                  {request.animalImage && (
                    <img 
                      src={request.animalImage} 
                      alt={request.animalName} 
                      className={styles.animalThumbnail} 
                    />
                  )}
                  <div className={styles.animalDetails}>
                    <h3>{request.animalName}</h3>
                    <p className={styles.animalSpecies}>{request.animalSpecies}</p>
                  </div>
                </div>
                
                <div className={styles.requestStatus}>
                  <span 
                    className={styles.statusBadge}
                    style={{ backgroundColor: getStatusColor(request.status) }}
                  > 
                    {getStatusText(request.status)}
                  </span>
                  <span className={styles.requestDate}>
                   Sent on {formatDate(request.createdAt)}
                  </span>
                  {request.updatedAt && request.updatedAt !== request.createdAt && (
                    <span className={styles.updateDate}>
                    Answered on {formatDate(request.updatedAt)}
                    </span>
                  )}
                </div>
              </div>
              
              <div className={styles.requestBody}>
                <div className={styles.myMessage}>
                  <h4>Your message:</h4>
                  <p>{request.message}</p>
                </div>
                
                {request.responseMessage && (
                  <div className={styles.ownerResponse}>
                    <h4>Owner response:</h4>
                    <p>{request.responseMessage}</p>
                  </div>
                )}
                
                {request.status === 'pending' && (
                  <div className={styles.pendingInfo}>
                    <p>⏳ Your request is being reviewed by the owner.</p>
                  </div>
                )}
                
                {request.status === 'accepted' && (
                  <div className={styles.acceptedInfo}>
                    <p>✅ Congratulations! Your request has been accepted.</p>
                  </div>
                )}
                
                {request.status === 'rejected' && (
                  <div className={styles.rejectedInfo}>
                    <p>❌ Your request was not successful this time.</p>
                   
                  </div>
                )}
              </div>
              
              <div className={styles.requestFooter}>
                <Link 
                  href={`/catalogueanimal/${request.animalId}`} 
                  className={styles.viewAnimalLink}
                >
                  See the announcement of the animal
                </Link>
                
                {request.status === 'accepted' && request.ownerEmail && (
                  <a 
                    href={`mailto:${request.ownerEmail}`}
                    className={styles.contactOwnerLink}
                  >
                    contact the owner
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyAdoptionRequests;