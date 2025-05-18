'use client';  
import { useState, useEffect } from 'react'; 
import MissingAnimalCard from '../component/DisappearAnimalCard'; 
import Link from 'next/link'; 
import styles from '../styles/disappearances.module.css'; 

export default function DisappearancesPage() { 
  const [missingReports, setMissingReports] = useState([]);   
  const [isLoading, setIsLoading] = useState(true);   
  const [error, setError] = useState(null);   
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const reportsPerPage = 6;      
  
  const fetchReports = async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/reports/get-disappearances?page=${page}&limit=${reportsPerPage}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setMissingReports(data.data);
        setTotalPages(data.pagination.totalPages);
        setCurrentPage(data.pagination.page);
      } else {
        throw new Error(data.message || 'Failed to load missing animal reports');
      }
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err.message || 'Failed to load missing animal reports');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(currentPage);
  }, [currentPage]);
  
  const paginate = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };
  
  if (isLoading) return <div className={styles.loadingContainer}>Loading reports...</div>;
  
  if (error) return <div className={styles.errorContainer}>{error}</div>;
  
  return (     
    <div className={styles.disappear}>       
      <div className={styles.disappearContainer}>         
        <h1 className={styles.disappearTitle}>Missing Animal Reports</h1>         
        <p className={styles.disappearDescription}>
          Help us reunite lost animals with their families. Browse through recent disappearance reports and contact owners if you have any information.
        </p>
        
        {/* Add a button to report a new disappearance */}         
        <div className={styles.actionButtonContainer}>           
          <Link href="../report" className={styles.reportButton}>             
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">               
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />             
            </svg>             
            Report Missing Animal           
          </Link>         
        </div>
        
        <div className={styles.disappearReportsList}>           
          {missingReports.length > 0 ? (             
            missingReports.map((report) => (               
              <MissingAnimalCard key={report.id} report={report} />            
            ))
          ) : (            
            <div className={styles.noReportsContainer}>               
              <p>No missing animal reports at this time.</p>             
            </div>
          )}        
        </div>
        
        {/* Pagination */}         
        {missingReports.length > 0 && totalPages > 1 && (           
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
              disabled={currentPage === totalPages}              
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