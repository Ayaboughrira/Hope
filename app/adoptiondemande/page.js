'use client'
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../styles/adoptiondemande.module.css';

const AdoptionRequests = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [responseMessage, setResponseMessage] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/adoptiondemande');
      return;
    }

    // Récupérer les demandes d'adoption uniquement si l'utilisateur est connecté
    if (status === 'authenticated') {
      fetchRequests(filter);
    }
  }, [status, filter, router]);

  // Fonction pour récupérer les demandes d'adoption
  const fetchRequests = async (filterValue) => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/adoptiondemande?filter=${filterValue}`);
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const { success, data } = await response.json();
      
      if (success) {
        setRequests(data);
      } else {
        throw new Error('Erreur lors de la récupération des demandes d\'adoption');
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour mettre à jour le statut d'une demande d'adoption
  const updateRequestStatus = async (requestId, newStatus) => {
    try {
      const response = await fetch(`/api/adoptiondemande/${requestId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          message: responseMessage
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const { success, message } = await response.json();
      
      if (success) {
        // Fermer la modal de réponse
        document.getElementById('responseModal').close();
        // Réinitialiser le message de réponse
        setResponseMessage('');
        // Actualiser la liste des demandes
        fetchRequests(filter);
        // Afficher un message de succès
        alert(message);
      } else {
        throw new Error(message || 'Erreur lors de la mise à jour du statut');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert(`Erreur: ${error.message}`);
    }
  };

  // Ouvrir la modal pour accepter ou rejeter une demande
  const openResponseModal = (request, action) => {
    setSelectedRequest({ ...request, action });
    document.getElementById('responseModal').showModal();
  };

  // Gérer la soumission du formulaire de réponse
  const handleResponseSubmit = (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    
    updateRequestStatus(selectedRequest._id, selectedRequest.action === 'approve' ? 'approved' : 'rejected');
  };

  // Formater la date pour l'affichage
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };
  
  // Obtenir le texte du statut en français
  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return 'En attente';
      case 'approved':
        return 'Acceptée';
      case 'rejected':
        return 'Rejetée';
      default:
        return status;
    }
  };

  // Obtenir la classe CSS pour le statut
  const getStatusClass = (status) => {
    switch (status) {
      case 'pending':
        return styles.statusPending;
      case 'approved':
        return styles.statusApproved;
      case 'rejected':
        return styles.statusRejected;
      default:
        return '';
    }
  };

  if (loading && status !== 'loading') {
    return <div className={styles.loading}>Chargement des demandes d'adoption...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.adoptionRequestsContainer}>
      <h1 className={styles.pageTitle}>Mes demandes d'adoption reçues</h1>
      
      <div className={styles.filtersContainer}>
        <button 
          className={`${styles.filterButton} ${filter === 'all' ? styles.active : ''}`}
          onClick={() => setFilter('all')}
        >
          Toutes
        </button>
        <button 
          className={`${styles.filterButton} ${filter === 'pending' ? styles.active : ''}`}
          onClick={() => setFilter('pending')}
        >
          En attente
        </button>
        <button 
          className={`${styles.filterButton} ${filter === 'approved' ? styles.active : ''}`}
          onClick={() => setFilter('approved')}
        >
          Acceptées
        </button>
        <button 
          className={`${styles.filterButton} ${filter === 'rejected' ? styles.active : ''}`}
          onClick={() => setFilter('rejected')}
        >
          Rejetées
        </button>
      </div>
      
      {requests.length === 0 ? (
        <div className={styles.noRequests}>
          <p>Aucune demande d'adoption {filter !== 'all' ? `avec le statut "${getStatusText(filter)}"` : ''} pour le moment.</p>
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
                      className={styles.animalImage} 
                    />
                  )}
                  <div>
                    <h2 className={styles.animalName}>{request.animalName}</h2>
                    <p className={styles.animalSpecies}>{request.animalSpecies}</p>
                  </div>
                </div>
                <div className={`${styles.statusBadge} ${getStatusClass(request.status)}`}>
                  {getStatusText(request.status)}
                </div>
              </div>
              
              <div className={styles.requestInfo}>
                <p className={styles.requesterInfo}>
                  Demande de: <strong>{request.requesterName}</strong> ({request.requesterEmail})
                </p>
                <p className={styles.requestDate}>
                  Reçue le: {formatDate(request.createdAt)}
                </p>
                <div className={styles.messageContainer}>
                  <h3>Message:</h3>
                  <p className={styles.requestMessage}>{request.message}</p>
                </div>
                
                {request.status === 'pending' && (
                  <div className={styles.actionButtons}>
                    <button 
                      className={styles.approveButton}
                      onClick={() => openResponseModal(request, 'approve')}
                    >
                      Accepter
                    </button>
                    <button 
                      className={styles.rejectButton}
                      onClick={() => openResponseModal(request, 'reject')}
                    >
                      Refuser
                    </button>
                  </div>
                )}
                
                {request.status !== 'pending' && request.responseMessage && (
                  <div className={styles.responseContainer}>
                    <h3>Votre réponse:</h3>
                    <p className={styles.responseMessage}>{request.responseMessage}</p>
                  </div>
                )}
                
                <Link href={`/animals/${request.animalId}`} className={styles.viewAnimalLink}>
                  Voir l'annonce de l'animal
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Modal pour répondre à une demande */}
      <dialog id="responseModal" className={styles.responseModal}>
        <div className={styles.modalContent}>
          {selectedRequest && (
            <>
              <h2>
                {selectedRequest.action === 'approve' 
                  ? `Accepter la demande pour ${selectedRequest.animalName}` 
                  : `Refuser la demande pour ${selectedRequest.animalName}`}
              </h2>
              
              <p>
                Demande de: <strong>{selectedRequest.requesterName}</strong>
              </p>
              
              <form onSubmit={handleResponseSubmit}>
                <div className={styles.formGroup}>
                  <label htmlFor="responseMessage">Message pour le demandeur:</label>
                  <textarea 
                    id="responseMessage"
                    className={styles.responseMessageInput}
                    value={responseMessage}
                    onChange={(e) => setResponseMessage(e.target.value)}
                    placeholder={selectedRequest.action === 'approve' 
                      ? `Félicitations! Votre demande d'adoption pour ${selectedRequest.animalName} a été acceptée...` 
                      : `Nous sommes désolés, mais votre demande d'adoption pour ${selectedRequest.animalName} n'a pas été retenue...`}
                    rows={6}
                  />
                </div>
                
                <div className={styles.modalButtons}>
                  <button 
                    type="button" 
                    className={styles.cancelButton}
                    onClick={() => document.getElementById('responseModal').close()}
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    className={`${styles.submitButton} ${selectedRequest.action === 'approve' ? styles.approveButton : styles.rejectButton}`}
                  >
                    {selectedRequest.action === 'approve' ? 'Confirmer l\'acceptation' : 'Confirmer le refus'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </dialog>
    </div>
);
};

export default AdoptionRequests;