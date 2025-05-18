'use client'
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../../../../styles/adoptionrequest.module.css';

const UserSpecificAdoptionRequests = () => {
  const router = useRouter();
  const params = useParams();
  const { userType, userId } = params;
  const { data: session, status } = useSession();
  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [responseMessage, setResponseMessage] = useState('');
  const [activeRequestId, setActiveRequestId] = useState(null);
  
  // Traduire userType pour l'interface
  const getUserTypeLabel = (type) => {
    switch(type) {
      case 'owner': return 'Propriétaire';
      case 'vet': return 'Vétérinaire';
      case 'association': return 'Association';
      case 'store': return 'Animalrie';
      default: return type;
    }
  };
  
  useEffect(() => {
    // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
    if (status === 'unauthenticated') {
      router.push(`/auth/signin?callbackUrl=/${userType}/${userId}/adoption-requests`);
      return;
    }
    
    // Vérifier que l'utilisateur a le droit d'accéder à cette page
    if (status === 'authenticated') {
      if (session.user.id !== userId) {
        // Rediriger si ce n'est pas le bon utilisateur
        router.push('/dashboard');
        return;
      }
      
      fetchRequests(activeTab);
    }
  }, [status, activeTab, router, session, userId, userType]);
  
  const fetchRequests = async (statusFilter) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/adoptiondemande?status=${statusFilter}`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const { success, data } = await response.json();
      
      if (success) {
        setRequests(data);
      } else {
        throw new Error('Échec du chargement des demandes');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des demandes:', error);
      setError(`Impossible de charger les demandes: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  const openResponseModal = (requestId) => {
    setActiveRequestId(requestId);
    setResponseMessage('');
    document.getElementById('responseModal').showModal();
  };
  
  const handleRequestResponse = async (status) => {
    if (!activeRequestId) return;
    
    try {
      const response = await fetch(`/api/adoptiondemande/${activeRequestId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          responseMessage,
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert(data.message);
        document.getElementById('responseModal').close();
        fetchRequests(activeTab); // Rafraîchir la liste
      } else {
        throw new Error(data.message || 'Une erreur est survenue');
      }
    } catch (error) {
      console.error('Erreur lors du traitement de la demande:', error);
      alert(`Erreur: ${error.message}`);
    }
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
  
  // Si la session est en cours de chargement
  if (status === 'loading') {
    return <div className={styles.loading}>Chargement...</div>;
  }
  
  // Si l'utilisateur n'est pas connecté, ne rien afficher (la redirection sera gérée par useEffect)
  if (status === 'unauthenticated') {
    return null;
  }
  
  return (
    <div className={styles.adoptionRequestsContainer}>
      <h1 className={styles.pageTitle}>
        Demandes d'adoption - {getUserTypeLabel(userType)}
      </h1>
      
      <div className={styles.tabsContainer}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'pending' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('pending')}
        >
          En attente
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'accepted' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('accepted')}
        >
          Acceptées
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'rejected' ? styles.activeTab : ''}`}
          onClick={() => handleTabChange('rejected')}
        >
          Rejetées
        </button>
      </div>
      
      {loading ? (
        <div className={styles.loading}>Chargement des demandes...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : requests.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Aucune demande {
            activeTab === 'pending' ? 'en attente' :
            activeTab === 'accepted' ? 'acceptée' : 'rejetée'
          }</p>
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
                  <div>
                    <h3>{request.animalName}</h3>
                    <p className={styles.animalSpecies}>{request.animalSpecies}</p>
                  </div>
                </div>
                
                <div className={styles.requestStatus}>
                  <span className={`${styles.statusBadge} ${styles[request.status]}`}>
                    {request.status === 'pending' ? 'En attente' :
                     request.status === 'accepted' ? 'Acceptée' : 'Rejetée'}
                  </span>
                  <span className={styles.requestDate}>
                    {formatDate(request.createdAt)}
                  </span>
                </div>
              </div>
              
              <div className={styles.requestBody}>
                <div className={styles.requesterInfo}>
                  <h4>Demandeur:</h4>
                  <p>{request.requesterName}</p>
                  <p>{request.requesterEmail}</p>
                </div>
                
                <div className={styles.requestMessage}>
                  <h4>Message:</h4>
                  <p>{request.message}</p>
                </div>
                
                {request.responseMessage && (
                  <div className={styles.responseMessage}>
                    <h4>Votre réponse:</h4>
                    <p>{request.responseMessage}</p>
                  </div>
                )}
              </div>
              
              {request.status === 'pending' && (
                <div className={styles.requestActions}>
                  <button 
                    className={styles.respondButton}
                    onClick={() => openResponseModal(request._id)}
                  >
                    Répondre à cette demande
                  </button>
                </div>
              )}
              
              <Link href={`/catalogueanimal/${request.animalId}`} className={styles.viewAnimalLink}>
                Voir l'annonce de l'animal
              </Link>
            </div>
          ))}
        </div>
      )}
      
      {/* Modal pour répondre à une demande */}
      <dialog id="responseModal" className={styles.responseModal}>
        <div className={styles.modalContent}>
          <h2>Répondre à la demande d'adoption</h2>
          
          <div className={styles.formGroup}>
            <label htmlFor="responseMessage">Message au demandeur (optionnel):</label>
            <textarea 
              id="responseMessage"
              className={styles.responseMessageInput}
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              placeholder="Bonjour, concernant votre demande d'adoption..."
              rows={5}
            />
          </div>
          
          <div className={styles.modalButtons}>
            <button 
              type="button" 
              className={`${styles.actionButton} ${styles.rejectButton}`}
              onClick={() => handleRequestResponse('rejected')}
            >
              Rejeter la demande
            </button>
            <button 
              type="button" 
              className={`${styles.actionButton} ${styles.acceptButton}`}
              onClick={() => handleRequestResponse('accepted')}
            >
              Accepter la demande
            </button>
            <button 
              type="button" 
              className={styles.cancelButton}
              onClick={() => document.getElementById('responseModal').close()}
            >
              Annuler
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
};

export default UserSpecificAdoptionRequests;