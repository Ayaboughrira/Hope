'use client';
import styles from '../page.module.css';

// Liste des emails d'administrateurs  
const ADMIN_EMAILS = [
   
  'helpingourpetseveryday@gmail.com',
  'hope65622@gmail.com ,'
   
];

 
const isAdminEmail = (email) => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase()) || 
         email.toLowerCase().includes('admin@') ||
         email.toLowerCase().endsWith('@admin.petplatform.com');
};

export const getUserTypeLabel = (userType, email) => {
  // Si c'est un admin, retourner "Admin" peu importe le userType
  if (isAdminEmail(email)) {
    return 'Admin';
  }
  
  const labels = {
    'owner': 'Pet Owner',
    'vet': 'Veterinarian',
    'association': 'Association',
    'store': 'Pet Store'
  };
  return labels[userType] || userType;
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid Date';
  }
};

export default function UserTable({ users, onDelete, onView, loading }) {
  console.log('UserTable rendered with props:', {
    usersCount: users?.length,
    onDeleteType: typeof onDelete,
    onViewType: typeof onView,
    loading
  });

  // Validation des props
  if (typeof onView !== 'function') {
    console.error('onView is not a function:', onView);
  }
  if (typeof onDelete !== 'function') {
    console.error('onDelete is not a function:', onDelete);
  }

  // Loading state
  if (loading) {
    return (
      <div className={styles.loadingTable}>
        <div className={styles.spinner}></div>
        <p>Loading users...</p>
      </div>
    );
  }

  // Empty state
  if (!users || users.length === 0) {
    return (
      <div className={styles.noUsers}>
        <div className={styles.noUsersIcon}>👥</div>
        <h3>No Users Found</h3>
        <p>Try adjusting your search criteria or filters.</p>
      </div>
    );
  }

  // Handle view button click
  const handleViewClick = (user, event) => {
    console.log('View button clicked for user:', user);
    
    // Prevent event propagation
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Validate user data
    if (!user) {
      console.error('No user data provided');
      return;
    }
    
    if (!user._id) {
      console.error('User ID is missing:', user);
      return;
    }
    
    // Call the onView function
    if (typeof onView === 'function') {
      try {
        console.log('Calling onView function with user:', user);
        onView(user);
      } catch (error) {
        console.error('Error calling onView:', error);
      }
    } else {
      console.error('onView is not a function!', typeof onView);
    }
  };

  // Handle delete button click
  const handleDeleteClick = (user, event) => {
    console.log('Delete button clicked for user:', user);
    
    // Prevent event propagation
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Validate user data
    if (!user) {
      console.error('No user data provided');
      return;
    }
    
    // Call the onDelete function
    if (typeof onDelete === 'function') {
      try {
        console.log('Calling onDelete function with user:', user);
        onDelete(user);
      } catch (error) {
        console.error('Error calling onDelete:', error);
      }
    } else {
      console.error('onDelete is not a function!', typeof onDelete);
    }
  };

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Type</th>
              <th>Registration Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => {
              // Ensure user has required fields
              const userDisplay = {
                _id: user._id || `temp-${Date.now()}`,
                name: user.name || 'Unknown User',
                email: user.email || 'No Email',
                userType: user.userType || 'unknown',
                createdAt: user.createdAt,
                phone: user.phone,
                address: user.address
              };

              // Vérifier si c'est un admin
              const isAdmin = isAdminEmail(userDisplay.email);
              
              return (
                <tr key={userDisplay._id} className={styles.tableRow}>
                  <td className={styles.nameCell}>
                    <div className={styles.nameInfo}>
                      <span className={styles.userName}>{userDisplay.name}</span>
                      {userDisplay.phone && (
                        <span className={styles.userPhone}>{userDisplay.phone}</span>
                      )}
                      {userDisplay.address && (
                        <span className={styles.userAddress}>{userDisplay.address}</span>
                      )}
                    </div>
                  </td>
                  <td className={styles.emailCell}>
                    {userDisplay.email !== 'No Email' ? (
                      <a href={`mailto:${userDisplay.email}`} className={styles.emailLink}>
                        {userDisplay.email}
                      </a>
                    ) : (
                      <span className={styles.noEmailText}>{userDisplay.email}</span>
                    )}
                  </td>
                  <td>
                    <span className={`${styles.badge} ${isAdmin ? styles.admin : (styles[userDisplay.userType] || '')}`}>
                      {getUserTypeLabel(userDisplay.userType, userDisplay.email)}
                    </span>
                  </td>
                  <td className={styles.dateCell}>
                    {formatDate(userDisplay.createdAt)}
                  </td>
                  <td className={styles.actionsCell}>
                    <div className={styles.actions}>
                      <button
                        type="button"
                        onClick={(event) => handleViewClick(user, event)}
                        className={`${styles.button} ${styles.view}`}
                        title={`View ${userDisplay.name}'s dashboard`}
                        disabled={typeof onView !== 'function' || !user._id}
                      >
                        <span className={styles.buttonIcon}>👁️</span>
                        View
                      </button>
                      <button
                        type="button"
                        onClick={(event) => handleDeleteClick(user, event)}
                        className={`${styles.button} ${styles.delete}`}
                        title={`Delete ${userDisplay.name}`}
                        disabled={typeof onDelete !== 'function' || !user._id}
                      >
                        <span className={styles.buttonIcon}>🗑️</span>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}