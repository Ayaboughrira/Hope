'use client';

import { useState, useEffect } from 'react';
import AbuseReportCard from '../component/AbuseReportCard';
import Link from 'next/link';
import styles from '../styles/abuseReports.module.css';

// This would be replaced with an actual API call in production
 

export default function AbuseReportsPage() {
  const [abuseReports, setAbuseReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const reportsPerPage = 6;
  
  useEffect(() => {
    // In a real implementation, fetch data from your MongoDB API
    // For now, we're using the static JSON data
    try {
      // Filter to show only abuse reports
      const filteredReports = reportsData.reports.filter(
        report => report.reportType === 'abuse'
      );
      setAbuseReports(filteredReports);
      setIsLoading(false);
    } catch (err) {
      setError('Failed to load animal abuse reports');
      setIsLoading(false);
    }
  }, []);
  
  // Get current reports based on pagination
  const indexOfLastReport = currentPage * reportsPerPage;
  const indexOfFirstReport = indexOfLastReport - reportsPerPage;
  const currentReports = abuseReports.slice(indexOfFirstReport, indexOfLastReport);
  
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  
  if (isLoading) return <div className={styles.loadingContainer}>Loading reports...</div>;
  if (error) return <div className={styles.errorContainer}>{error}</div>;
  
  return (
    <div className={styles.abuseReports}>
      <div className={styles.abuseReportsContainer}>
        <h1 className={styles.abuseReportsTitle}>Animal Abuse Reports</h1>
        <p className={styles.abuseReportsDescription}>
          Help us fight against animal cruelty. Browse through recent animal abuse reports and take action to protect animals in need.
        </p>
        
        {/* Add a button to report a new abuse case */}
        <div className={styles.actionButtonContainer}>
          <Link href="../report" className={styles.reportButton}>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Report Animal Abuse
          </Link>
        </div>
        
        <div className={styles.abuseReportsList}>
          {currentReports.length > 0 ? (
            currentReports.map((report) => (
              <AbuseReportCard key={report.id} report={report} />
            ))
          ) : (
            <div className={styles.noReportsContainer}>
              <p>No animal abuse reports at this time.</p>
            </div>
          )}
        </div>
        
        {/* Pagination */}
        {abuseReports.length > reportsPerPage && (
          <div className={styles.paginationButtons}>
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className={styles.viewMoreButton}
            >
              <span className={styles.buttonIcon}>←</span> Previous
            </button>
            
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === Math.ceil(abuseReports.length / reportsPerPage)}
              className={styles.viewMoreButton}
            >
              Next <span className={styles.buttonIcon}>→</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}