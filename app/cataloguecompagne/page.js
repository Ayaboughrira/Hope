'use client'
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import styles from '../styles/cataloguecompagne.module.css'; 

function formatDate(dateString) {
  const date = new Date(dateString);
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

export default function Campaigns() {
  const router = useRouter();
  const { data: session } = useSession();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleCampaigns, setVisibleCampaigns] = useState(5);

  // Charger les campagnes depuis l'API
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/compagne');
        
        if (!response.ok) {
          throw new Error('Erreur lors du chargement des campagnes');
        }
        
        const data = await response.json();
        setCampaigns(data);
      } catch (err) {
        console.error('Erreur lors du chargement des campagnes:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, []);
  
  const loadMoreCampaigns = () => {
    setVisibleCampaigns(prevVisible => prevVisible + 5);
  };
  
  const loadLessCampaigns = () => {
    setVisibleCampaigns(prevVisible => Math.max(5, prevVisible - 5));
  };
  
  const campaignsToShow = campaigns.slice(0, visibleCampaigns);
  const hasMoreCampaigns = visibleCampaigns < campaigns.length;

  const handleLearnMoreClick = (campaignId) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/cataloguecompagne/${campaignId}`);
  };

  // Composant de chargement
  if (loading) {
    return (
      <div className={styles["adopt-container"]}>
        <h1 className={styles["adopt-title"]}>Campaigns for Animals</h1>
        <div className={styles["loading-container"]}>
          <div className={styles["loading-spinner"]}></div>
          <p>Chargement des campagnes...</p>
        </div>
      </div>
    );
  }

  // Composant d'erreur
  if (error) {
    return (
      <div className={styles["adopt-container"]}>
        <h1 className={styles["adopt-title"]}>Campaigns for Animals</h1>
        <div className={styles["error-container"]}>
          <p>Erreur: {error}</p>
          <button onClick={() => window.location.reload()}>
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className={styles["adopt-container"]}>
        <h1 className={styles["adopt-title"]}>Campaigns for Animals</h1>
        
        <p className={styles["adopt-description"]}>
          Discover how our campaigns are saving lives. Be part of the change they deserve.
        </p>

        {/* Bouton pour créer une nouvelle campagne (seulement pour les associations) */}
       {/*} {session && session.user.userType === 'association' && (
          <div className={styles["create-campaign-section"]}>
            <Link href="/postcompagne" className={styles["create-campaign-button"]}>
              + Créer une nouvelle campagne
            </Link>
          </div>
        )}*/}

        {campaigns.length === 0 ? (
          <div className={styles["no-campaigns"]}>
            <p>Aucune campagne disponible pour le moment.</p>
            {session && session.user.userType === 'association' && (
              <p>Soyez le premier à créer une campagne !</p>
            )}
          </div>
        ) : (
          <>
            <div className={styles["adopt-campaigns-list"]}>
              {campaignsToShow.map((campaign) => (
                <div key={campaign.id} className={styles["adopt-campaign-card"]}>
                  <Link href={`/cataloguecompagne/${campaign.id}`} className={styles["adopt-main-card-link"]}>
                    <div className={styles["adopt-card-image-container"]}>
                      <img 
                        src={campaign.image} 
                        alt={campaign.name || "Campaign image"}
                        className={styles["adopt-card-image"]}
                        onError={(e) => {
                          e.target.src = '/api/placeholder/400/300';
                        }}
                      />
                      <div className={styles["adopt-campaign-badge"]}>
                        {new Date(campaign.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) ? 'New' : 'Active'}
                      </div>
                    </div>
                    <div className={styles["adopt-card-content"]}>
                      <div className={styles["adopt-association-tag"]}>
                        <span>{campaign.association || "Association"}</span>
                      </div>
                      <h2>{campaign.name || "Campaign"}</h2>
                      <div className={styles["adopt-location"]}>
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
                        <span>{campaign.location || "Location"}</span>
                      </div>
                      <p className={styles["adopt-campaign-description"]}>
                        {campaign.shortDescription || campaign.description?.substring(0, 150) + "..." || ""}
                      </p>
                      <div className={styles["adopt-campaign-stats"]}>
                        <div className={styles["adopt-stat"]}>
                          <span className={styles["adopt-stat-value"]}>
                            {campaign.startDate ? formatDate(campaign.startDate) : "TBD"}
                          </span>
                          <span className={styles["adopt-stat-label"]}> Start Date</span>
                        </div>
                        <div className={styles["adopt-stat"]}>
                          <span className={styles["adopt-stat-value"]}>
                            {campaign.startTime || "TBD"}
                          </span>
                          <span className={styles["adopt-stat-label"]}>Start Time</span>
                        </div>
                        <div className={styles["adopt-stat"]}>
                          <span className={styles["adopt-stat-value"]}>
                            {campaign.endDate ? formatDate(campaign.endDate) : "TBD"}
                          </span>
                          <span className={styles["adopt-stat-label"]}> End Date </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                  <div className={styles["adopt-card-footer"]}>
                    <button 
                      className={styles["adopt-support-button"]}
                      onClick={handleLearnMoreClick(campaign.id)}
                    >
                      View more
                    </button>
                  </div>
                </div>
              ))}
            </div>
            
            <div className={styles["adopt-pagination-buttons"]}>
              {visibleCampaigns > 5 && (
                <button 
                  className={styles["adopt-view-less-button"]}
                  onClick={loadLessCampaigns}
                >
                  <span className={styles["adopt-button-icon"]}>-</span>
                  Voir moins
                </button>
              )}
              
              {hasMoreCampaigns && (
                <button 
                  className={styles["adopt-view-more-button"]}
                  onClick={loadMoreCampaigns}
                >
                  <span className={styles["adopt-button-icon"]}>+</span>
                  Voir plus
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}