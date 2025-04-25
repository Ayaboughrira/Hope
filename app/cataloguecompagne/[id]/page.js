'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import styles from '../../styles/compagnedetail.module.css';
import campaignsData from '../compagne.json';


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
  const { id } = params;
  
  // State pour les données de la campagne
  const [campaign, setCampaign] = useState(null);
  // State pour suivre l'état de chargement
  const [isLoading, setIsLoading] = useState(true);
  // State pour suivre quelle image est actuellement affichée
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Nouveaux states pour le formulaire de participation
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  
  // Utiliser useEffect pour trouver la campagne une fois que les paramètres sont disponibles
  useEffect(() => {
    if (id) {
      const foundCampaign = campaignsData.find(c => c.id.toString() === id.toString());
      if (foundCampaign) {
        setCampaign(foundCampaign);
      } else {
        // Rediriger vers la liste des campagnes si la campagne n'est pas trouvée
        router.push('/cataloguecompagne');
      }
      setIsLoading(false);
    }
  }, [id, router]);
  
  // Vérifier si l'utilisateur est connecté
  useEffect(() => {
    async function checkAuthStatus() {
      try {
        // Remplacez ceci par votre propre logique d'authentification
        const user = await getAuthUser();
        if (user) {
          setCurrentUser(user);
          // Pré-remplir le formulaire avec les informations de l'utilisateur
          setFormData({
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            message: ''
          });
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de l'authentification:", error);
      }
    }
    
    checkAuthStatus();
  }, []);
  
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
      // Simulation d'envoi d'email à l'association
      // Dans un environnement réel, vous utiliseriez une API pour envoyer l'email
      console.log('Envoi de la demande de participation à:', campaign.association);
      console.log('Données du formulaire:', formData);
      
      // Simuler un délai d'envoi
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Afficher le message de succès
      setSubmitSuccess(true);
      
      // Fermer le formulaire après 3 secondes
      setTimeout(() => {
        setShowJoinForm(false);
        setSubmitSuccess(false);
      }, 3000);
    } catch (error) {
      console.error("Erreur lors de l'envoi de la demande:", error);
      setSubmitError("Une erreur s'est produite lors de l'envoi de votre demande. Veuillez réessayer.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading campaign details...</div>;
  }

  if (!campaign) {
    return <div className={styles.error}>Campaign not found</div>;
  }

  // Constantes pour les props calculées
  const mainImage = campaign.images?.[currentImageIndex] || campaign.image;
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
                  <img src={image} alt={`${campaign.name} - Thumbnail ${index + 1}`} />
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
               <div className={styles.dateLabel}>Campaign Period</div>
             </div>
             <div className={styles.timeInfo}>
               <div className={styles.timeValue}>{campaign.startTime || "TBD"}</div>
               <div className={styles.timeLabel}>Event Time</div>
             </div>
           </div>
         </div>
          
          <div className={styles.campaignDescription}>
            <h2>About This Campaign</h2>
            <p>{campaign.description || "No description available."}</p>
          </div>
          
          {campaign.requirements && campaign.requirements.length > 0 && (
            <div className={styles.campaignDetails}>
              <h2>What You Need To Know</h2>
              <ul>
                {campaign.requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className={styles.actionButtons}>
            <button className={styles.adoptButton} onClick={() => setShowJoinForm(true)}>Join</button>
            <button className={styles.contactButton}>Contact Association</button>
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
            
            <h2>Join {campaign.name}</h2>
            
            {submitSuccess ? (
              <div className={styles.successMessage}>
                <p>Your request to participate has been successfully sent to {campaign.association}!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label htmlFor="firstName"> Last Name:</label>
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
                  <label htmlFor="lastName">First Name:</label>
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
                  <label htmlFor="email">Email:</label>
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
                  <label htmlFor="number">Phone Number:</label>
                  <textarea
                    id="number"
                    name="number"
                    value={formData.number}
                    onChange={handleInputChange}
                    required
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
                    {isSubmitting ? 'Sending in progress...' : 'Sent'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      
      <div className={styles.relatedCampaigns}>
        <h2>Other Campaigns</h2>
        <div className={styles.relatedList}>
          {campaignsData
            .filter(c => c.id !== campaign.id)
            .slice(0, 3)
            .map(relatedCampaign => (
              <Link href={`/cataloguecompagne/${relatedCampaign.id}`} key={relatedCampaign.id}>
                <div className={styles.relatedCard}>
                  <img 
                    src={relatedCampaign.image} 
                    alt={relatedCampaign.name} 
                    className={styles.relatedImage}
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