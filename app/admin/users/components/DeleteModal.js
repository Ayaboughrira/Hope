//admin/users/components/DeleteModal.js
'use client';
import { useEffect } from 'react';
import styles from '../page.module.css';

const getUserTypeLabel = (userType) => {
  const labels = {
    'owner': 'Pet Owner',
    'vet': 'Veterinarian',
    'association': 'Association',
    'store': 'Pet Store'
  };
  return labels[userType] || userType;
};

export default function DeleteModal({ isOpen, user, onConfirm, onCancel, loading }) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !loading) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, loading, onCancel]);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <div className={styles.modalIcon}>⚠️</div>
          <h3>Confirm User Deletion</h3>
          {!loading && (
            <button
              onClick={onCancel}
              className={styles.modalClose}
              title="Close"
            >
              ✕
            </button>
          )}
        </div>

        <div className={styles.modalBody}>
          {user && (
            <div className={styles.userInfo}>
              <div className={styles.userDetails}>
                <p><strong>Name:</strong> {user.name}</p>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>Type:</strong> {getUserTypeLabel(user.userType)}</p>
                {user.phone && <p><strong>Phone:</strong> {user.phone}</p>}
              </div>
            </div>
          )}
          
          <div className={styles.warningMessage}>
            <p>
              Are you sure you want to delete this user? This action cannot be undone.
            </p>
            <p className={styles.warningNote}>
              All associated data including profiles, favorites, and requests will be permanently removed.
            </p>
          </div>
        </div>

        <div className={styles.modalActions}>
          <button
            onClick={onCancel}
            disabled={loading}
            className={`${styles.button} ${styles.cancel}`}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`${styles.button} ${styles.confirm} ${loading ? styles.loading : ''}`}
          >
            {loading ? (
              <>
                <span className={styles.spinner}></span>
                Deleting...
              </>
            ) : (
              'Delete User'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}