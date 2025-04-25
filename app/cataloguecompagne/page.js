//page pour catalogue compagne 
'use client'
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from '../styles/cataloguecompagne.module.css'; 
import campaignsData from './compagne.json';


function formatDate(dateString) {
  const date = new Date(dateString);
  const month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
}

export default function Campaigns() {
  const router = useRouter();
  const [visibleCampaigns, setVisibleCampaigns] = useState(5);
  
  const loadMoreCampaigns = () => {
    setVisibleCampaigns(prevVisible => prevVisible + 5);
  };
  
  const loadLessCampaigns = () => {
    setVisibleCampaigns(prevVisible => Math.max(5, prevVisible - 5));
  };
  
  const campaignsToShow = campaignsData.slice(0, visibleCampaigns);
  const hasMoreCampaigns = visibleCampaigns < campaignsData.length;

  const handleAdoptClick = (campaignId) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/cataloguecompagne/${campaignId}`);
  };

  return (
   <div>
     <div className={styles["adopt-container"]}>
      <h1 className={styles["adopt-title"]}>Campaigns for Animals</h1>
      
      <p className={styles["adopt-description"]}>
         Discover how our campaigns are saving lives. Be part of the change they deserve.
      </p>

      <div className={styles["adopt-campaigns-list"]}>
        {campaignsToShow.map((campaign) => (
          <div key={campaign.id} className={styles["adopt-campaign-card"]}>
            <Link href={`/cataloguecompagne/${campaign.id}`} className={styles["adopt-main-card-link"]}>
              <div className={styles["adopt-card-image-container"]}>
                <img 
                  src={campaign.image} 
                  alt={campaign.name || "Campaign image"}
                  className={styles["adopt-card-image"]}
                />
                <div className={styles["adopt-campaign-badge"]}>
                  {campaign.id <= 3 ? 'Featured' : 'New'}
                </div>
              </div>
              <div className={styles["adopt-card-content"]}>
                <div className={styles["adopt-association-tag"]}>
                  {/* Make the association name dynamic from the campaign data */}
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
                <p className={styles["adopt-campaign-description"]}>{campaign.shortDescription || ""}</p>
                <div className={styles["adopt-campaign-stats"]}>
                  <div className={styles["adopt-stat"]}>
                    <span className={styles["adopt-stat-value"]}>{campaign.startDate ? formatDate(campaign.startDate) : "TBD"}</span>
                    <span className={styles["adopt-stat-label"]}>Start Date</span>
                  </div>
                  <div className={styles["adopt-stat"]}>
                    <span className={styles["adopt-stat-value"]}>{campaign.startTime || "TBD"}</span>
                    <span className={styles["adopt-stat-label"]}>Start Time</span>
                  </div>
                  <div className={styles["adopt-stat"]}>
                    <span className={styles["adopt-stat-value"]}>{campaign.endDate ? formatDate(campaign.endDate) : "TBD"}</span>
                    <span className={styles["adopt-stat-label"]}>End Date</span>
                  </div>
                </div>
              </div>
            </Link>
            <div className={styles["adopt-card-footer"]}>
              
              <button 
                className={styles["adopt-support-button"]}
                onClick={handleAdoptClick(campaign.id)}
              >
                Learn more
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
            View less
          </button>
        )}
        
        <button 
          className={styles["adopt-view-more-button"]}
          onClick={loadMoreCampaigns}
          disabled={!hasMoreCampaigns}
        >
          <span className={styles["adopt-button-icon"]}>+</span>
          View more
        </button>
      </div>
    </div>
   
   </div>
    
   
    
   

    
    

    
  );
}