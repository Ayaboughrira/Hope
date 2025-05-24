'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styles from '../../styles/compagnedetail.module.css';

// Fonction de formatage de date stable entre serveur et client
function formatDate(dateString) {
  const date = new Date(dateString);
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

export default function CampaignDetail() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const { id } = params;
  
  // State pour les données de la campagne (récupérées depuis l'API)
  const [campaign, setCampaign] = useState(null);
  const [allCampaigns, setAllCampaigns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State pour la gestion des images
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Nouveaux states pour le formulaire de participation
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  
  // Charger les données de la campagne depuis l'API
  useEffect(() => {
    const fetchCampaignData = async () => {
      if (!id) return;
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Récupérer la campagne spécifique depuis l'API
        const response = await fetch(`/api/compagne/${id}`);
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement de la campagne');
        }
        
        const campaignData = await response.json();
        setCampaign(campaignData);
        
        // Récupérer toutes les campagnes pour les suggestions
        const allCampaignsResponse = await fetch('/api/compagne');
        if (allCampaignsResponse.ok) {
          const campaigns = await allCampaignsResponse.json();
          setAllCampaigns(campaigns);
        }
        
      } catch (err) {
        console.error('Erreur lors du chargement de la campagne:', err);
        setError(err.message);
        // Rediriger vers la liste si campagne non trouvée
        if (err.message.includes('non trouvée')) {
          router.push('/cataloguecompagne');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaignData();
  }, [id, router]);
  
  // Pré-remplir le formulaire avec les données utilisateur si connecté
  useEffect(() => {
    if (session?.user) {
      setFormData(prev => ({
        ...prev,
        firstName: session.user.firstName || '',
        lastName: session.user.lastName || '',
        email: session.user.email || ''
      }));
    }
  }, [session]);
  
  // Fonction pour gérer la navigation des images
  const nextImage = () => {
    if (campaign?.images && campaign.images.length > 1) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === campaign.images.length - 1 ? 0 : prevIndex + 1
      );
    }
  };
  
  const prevImage = () => {
    if (campaign?.images && campaign.images.length > 1) {
      setCurrentImageIndex((prevIndex) => 
        prevIndex === 0 ? campaign.images.length - 1 : prevIndex - 1
      );
    }
  };
  
  // Fonction pour gérer les changements dans le formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Fonction pour gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setSubmitError('');
    
    try {
      const participantData = {
        ...formData,
        campaignId: campaign.id,
        campaignName: campaign.name,
        associationName: campaign.association,
        userId: session?.user?.id || null, // Peut être null pour les non-connectés
        submittedAt: new Date().toISOString()
      };

      const response = await fetch('/api/participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(participantData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'inscription');
      }
      
      // Afficher le message de succès
      setSubmitSuccess(true);
      
      // Fermer le formulaire après 3 secondes
      setTimeout(() => {
        setShowJoinForm(false);
        setSubmitSuccess(false);
        // Réinitialiser le formulaire
        setFormData({
          firstName: session?.user?.firstName || '',
          lastName: session?.user?.lastName || '',
          email: session?.user?.email || '',
          phone: '',
          message: ''
        });
      }, 3000);
      
    } catch (error) {
      console.error("Erreur lors de l'inscription:", error);
      setSubmitError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Composant de chargement
  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.loadingSpinner}></div>
          <p>Chargement des détails de la campagne...</p>
        </div>
      </div>
    );
  }

  // Composant d'erreur
  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Erreur: {error}</p>
          <button onClick={() => window.location.reload()}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Campaign not found</div>
      </div>
    );
  }

  // Constantes pour les props calculées (adaptées à la nouvelle structure)
  const mainImage = campaign.images?.[currentImageIndex]?.url || campaign.image;
  const hasMultipleImages = campaign.images && campaign.images.length > 1;

  return (
    <div className={styles.container}>
      <div className={styles.breadcrumbs}>
        <Link href="/cataloguecompagne">
          Campaigns
        </Link>
        <span> &gt; </span>
        <span>{campaign.name}</span>
      </div>
      
      <div className={styles.campaignDetailContainer}>
        <div className={styles.imageGallery}>
          <div className={styles.mainImage}>
            <img 
              src={mainImage} 
              alt={`${campaign.name} - Image`}
              onError={(e) => {
                e.target.src = '/api/placeholder/400/300';
              }}
            />
            {hasMultipleImages && (
              <>
                <button className={`${styles.navButton} ${styles.prevButton}`} onClick={prevImage}>
                  &lt;
                </button>
                <button className={`${styles.navButton} ${styles.nextButton}`} onClick={nextImage}>
                  &gt;
                </button>
              </>
            )}
          </div>
          {hasMultipleImages && (
            <div className={styles.thumbnails}>
              {campaign.images.map((image, index) => (
                <div 
                  key={index} 
                  className={`${styles.thumbnail} ${index === currentImageIndex ? styles.activeThumbnail : ''}`}
                  onClick={() => setCurrentImageIndex(index)}
                >
                  <img 
                    src={image.url} 
                    alt={`${campaign.name} - Thumbnail ${index + 1}`}
                    onError={(e) => {
                      e.target.src = '/api/placeholder/150/150';
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className={styles.campaignInfo}>
          <div className={styles.campaignHeader}>
            <div className={styles.associationBadge}>{campaign.association}</div>
            <h1 className={styles.campaignTitle}>{campaign.name}</h1>
            <div className={styles.location}>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>{campaign.location}</span>
            </div>
          </div>
          
          <div className={styles.campaignDates}>
            <div className={styles.dateTimeContainer}>
              <div className={styles.dateInfo}>
                <div className={styles.dateValue}>
                  {campaign.startDate ? formatDate(campaign.startDate) : "TBD"} - {campaign.endDate ? formatDate(campaign.endDate) : "TBD"}
                </div>
                <div className={styles.dateLabel}>Période de campagne</div>
              </div>
              <div className={styles.timeInfo}>
                <div className={styles.timeValue}>{campaign.startTime || "TBD"}</div>
                <div className={styles.timeLabel}>Heure de début</div>
              </div>
            </div>
          </div>
          
          <div className={styles.campaignDescription}>
            <h2>À propos de cette campagne</h2>
            <p>{campaign.description || "Aucune description disponible."}</p>
          </div>
          
          {campaign.objective && (
            <div className={styles.campaignDetails}>
              <h2>Objectif de la campagne</h2>
              <p>{campaign.objective}</p>
            </div>
          )}
          
          <div className={styles.campaignContact}>
            <h2>Contact</h2>
            <div className={styles.contactInfo}>
              {campaign.email && (
                <div className={styles.contactItem}>
                  <strong>Email:</strong> {campaign.email}
                </div>
              )}
              {campaign.phone && (
                <div className={styles.contactItem}>
                  <strong>Téléphone:</strong> {campaign.phone}
                </div>
              )}
            </div>
          </div>
          
          <div className={styles.actionButtons}>
            {/* Bouton "Participer" disponible pour tous */}
            <button 
              className={styles.adoptButton} 
              onClick={() => setShowJoinForm(true)}
            >
              Participer
            </button>
            <a href={`mailto:${campaign.email}`}>
              <button className={styles.contactButton}>
                Contacter l'association
              </button>
            </a>
          </div>
        </div>
      </div>
      
      {/* Modal pour le formulaire de participation */}
      {showJoinForm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <button 
              className={styles.closeButton}
              onClick={() => {
                setShowJoinForm(false);
                setSubmitSuccess(false);
                setSubmitError('');
              }}
            >
              ×
            </button>
            
            <h2>Participer à {campaign.name}</h2>
            
            {submitSuccess ? (
              <div className={styles.successMessage}>
                <p>Votre demande de participation a été envoyée avec succès à {campaign.association}!</p>
                <p>Un email de confirmation a été envoyé à l'association.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label htmlFor="firstName">Prénom *:</label>
                  <input 
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="lastName">Nom *:</label>
                  <input 
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="email">Email *:</label>
                  <input 
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="phone">Numéro de téléphone *:</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="message">Message (optionnel):</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="Dites-nous pourquoi vous souhaitez participer à cette campagne..."
                  />
                </div>
                
                {submitError && (
                  <div className={styles.errorMessage}>
                    <p>{submitError}</p>
                  </div>
                )}
                
                <div className={styles.formActions}>
                  <button 
                    type="submit" 
                    className={styles.submitButton}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Envoi en cours...' : 'Envoyer la demande'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      
      <div className={styles.relatedCampaigns}>
        <h2>Autres campagnes</h2>
        <div className={styles.relatedList}>
          {allCampaigns
            .filter(c => c.id !== campaign.id)
            .slice(0, 3)
            .map(relatedCampaign => (
              <Link href={`/cataloguecompagne/${relatedCampaign.id}`} key={relatedCampaign.id}>
                <div className={styles.relatedCard}>
                  <img 
                    src={relatedCampaign.image} 
                    alt={relatedCampaign.name} 
                    className={styles.relatedImage}
                    onError={(e) => {
                      e.target.src = '/api/placeholder/200/150';
                    }}
                  />
                  <div className={styles.relatedContent}>
                    <h3>{relatedCampaign.name}</h3>
                    <p>{relatedCampaign.location}</p>
                  </div>
                </div>
              </Link>
            ))
          }
        </div>
      </div>
    </div>
  );
}