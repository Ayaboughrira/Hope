'use client'
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../styles/adoptiondemande.module.css';

const AdoptionRequests = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [responseMessage, setResponseMessage] = useState('');
  const [activeRequestId, setActiveRequestId] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmationData, setConfirmationData] = useState(null);
  
  useEffect(() => {
    // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
    if (status === 'unauthenticated') {
      router.push('/signuplogin?callbackUrl=/adoptiondemande');
      return;
    }
    
    // Si le chargement de la session est terminé et que l'utilisateur est connecté
    if (status === 'authenticated') {
      fetchRequests(activeTab);
    }
  }, [status, activeTab, router]);
  
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
  
  const closeResponseModal = () => {
    document.getElementById('responseModal').close();
    setActiveRequestId(null);
    setResponseMessage('');
  };
  
  const showConfirmationModal = (data) => {
    setConfirmationData(data);
    setShowConfirmation(true);
    document.getElementById('confirmationModal').showModal();
  };
  
  const closeConfirmationModal = () => {
    document.getElementById('confirmationModal').close();
    setShowConfirmation(false);
    setConfirmationData(null);
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
        // Fermer la modal de réponse
        closeResponseModal();
        
        // Trouver les informations de la demande pour la confirmation
        const request = requests.find(req => req._id === activeRequestId);
        
        // Afficher la modal de confirmation
        showConfirmationModal({
          status: status,
          animalName: request?.animalName || 'l\'animal',
          requesterName: request?.requesterName || 'le demandeur',
          message: data.message
        });
        
        // Rafraîchir la liste
        fetchRequests(activeTab);
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
    return <div className={styles.loading}>Loading...</div>;
  }
  
  // Si l'utilisateur n'est pas connecté, ne rien afficher (la redirection sera gérée par useEffect)
  if (status === 'unauthenticated') {
    return null;
  }
  
  return (
    <div className={styles.adoptionRequestsContainer}>
      <h1 className={styles.pageTitle}>Requests for adoption received</h1>
      
      <div className={styles.tabsContainer}>
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
        <div className={styles.loading}>Loading requests...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : requests.length === 0 ? (
        <div className={styles.emptyState}>
          <p>No request {
            activeTab === 'pending' ? 'Pending' :
            activeTab === 'accepted' ? 'Accepted' : 'Rejected'
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
                    {request.status === 'pending' ? 'Pending' :
                     request.status === 'accepted' ? 'Accepted' : 'Rejected'}
                  </span>
                  <span className={styles.requestDate}>
                    {formatDate(request.createdAt)}
                  </span>
                </div>
              </div>
              
              <div className={styles.requestBody}>
                <div className={styles.requesterInfo}>
                  <h4>Requester:</h4>
                  <p>{request.requesterName}</p>
                  <p>{request.requesterEmail}</p>
                </div>
                
                <div className={styles.requestMessage}>
                  <h4>Message:</h4>
                  <p>{request.message}</p>
                </div>
                
                {request.responseMessage && (
                  <div className={styles.responseMessage}>
                    <h4>Your response:</h4>
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
                    Reply to this request
                  </button>
                </div>
              )}
              
              <Link href={`/catalogueanimal/${request.animalId}`} className={styles.viewAnimalLink}>
               View the animal's ad
              </Link>
            </div>
          ))}
        </div>
      )}
      
      {/* Modal pour répondre à une demande */}
      <dialog id="responseModal" className={styles.responseModal}>
        <div className={styles.modalContent}>
          <h2> Reply to adoption request </h2>
          
          <div className={styles.formGroup}>
            <label htmlFor="responseMessage">Message to the requester (optionnel):</label>
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
              Reject the request 
            </button>
            <button 
              type="button" 
              className={`${styles.actionButton} ${styles.acceptButton}`}
              onClick={() => handleRequestResponse('accepted')}
            >
              Accept the request  
            </button>
            <button 
              type="button" 
              className={styles.cancelButton}
              onClick={closeResponseModal}
            >
              Cancel
            </button>
          </div>
        </div>
      </dialog>

      {/* Modal de confirmation */}
      <dialog id="confirmationModal" className={styles.confirmationModal}>
        <div className={styles.confirmationContent}>
          <div className={styles.confirmationIcon}>
            {confirmationData?.status === 'accepted' ? '✓' : '✕'}
          </div>
          <h2 className={styles.confirmationTitle}>
            {confirmationData?.status === 'accepted' ? 
              'Request accepted successfuly!' : 
              'Request rejected'
            }
          </h2>
          <p className={styles.confirmationMessage}>
            {confirmationData?.status === 'accepted' ? 
              ` You are accepted the adoption request of ${confirmationData?.animalName} by ${confirmationData?.requesterName}.` :
              `You are  rejected the adoption request of ${confirmationData?.animalName} by ${confirmationData?.requesterName}.`
            }
          </p>
          <button 
            className={styles.confirmationButton}
            onClick={closeConfirmationModal}
          >
           Close 
          </button>
        </div>
      </dialog>
    </div>
  );
};

export default AdoptionRequests;