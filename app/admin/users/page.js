'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import UserFilters from './components/UserFilters';
import UserTable from './components/UserTable';
import DeleteModal from './components/DeleteModal';
import styles from './page.module.css';

const getUserTypeLabel = (userType) => {
  const labels = {
    'owner': 'Pet Owner',
    'vet': 'Veterinarian',
    'association': 'Association',
    'store': 'Pet Store'
  };
  return labels[userType] || userType;
};

const formatDate = (dateString) => {
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

export default function AdminUsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State management
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalUsers: 0
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal states
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    user: null
  });

  const [viewUserModal, setViewUserModal] = useState({
    isOpen: false,
    user: null
  });

  // Filters state
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    userType: searchParams.get('userType') || 'all',
    sortBy: searchParams.get('sortBy') || 'newest'
  });

  // User types for filter dropdown
  const userTypes = [
    { value: 'owner', label: 'Pet Owners' },
    { value: 'vet', label: 'Veterinarians' },
    { value: 'association', label: 'Associations' },
    { value: 'store', label: 'Pet Stores' }
  ];

  // Fetch users function
  const fetchUsers = useCallback(async (page = 1, currentFilters = filters) => {
    setLoading(true);
    setError('');
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        search: currentFilters.search || '',
        userType: currentFilters.userType || 'all',
        sortBy: currentFilters.sortBy || 'newest'
      });

      console.log('Fetching users with params:', params.toString());

      const response = await fetch(`/api/admin/users?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();

      if (data.success) {
        console.log('Users fetched successfully:', data.users.length);
        setUsers(data.users || []);
        setPagination({
          currentPage: data.currentPage || 1,
          totalPages: data.totalPages || 1,
          totalUsers: data.totalUsers || 0
        });
      } else {
        const errorMessage = data.error || 'Failed to fetch users';
        console.error('API error:', errorMessage);
        setError(errorMessage);
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(`Network error: ${error.message}`);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Initialize and fetch users on mount
  useEffect(() => {
    fetchUsers(1, filters);
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback((newFilters) => {
    console.log('Filter change:', newFilters);
    setFilters(newFilters);
    
    // Update URL parameters
    const params = new URLSearchParams();
    if (newFilters.search) params.set('search', newFilters.search);
    if (newFilters.userType !== 'all') params.set('userType', newFilters.userType);
    if (newFilters.sortBy !== 'newest') params.set('sortBy', newFilters.sortBy);
    
    const newUrl = params.toString() ? `?${params.toString()}` : '/admin/users';
    router.push(newUrl, { scroll: false });
    
    // Fetch with new filters
    fetchUsers(1, newFilters);
  }, [router, fetchUsers]);

  // Handle pagination
  const handlePageChange = useCallback((newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages && !loading) {
      console.log('Page change to:', newPage);
      fetchUsers(newPage, filters);
    }
  }, [pagination.totalPages, loading, fetchUsers, filters]);

  // Handle delete user
  const handleDeleteUser = useCallback((user) => {
    console.log('Delete user initiated:', user);
    
    if (!user || !user._id) {
      console.error('Invalid user data for deletion:', user);
      setError('Cannot delete user: Invalid user data');
      return;
    }
    
    setDeleteModal({
      isOpen: true,
      user: user
    });
  }, []);

  // Confirm delete
  const confirmDelete = async () => {
    if (!deleteModal.user || !deleteModal.user._id) {
      console.error('No user to delete');
      return;
    }
    
    setDeleteLoading(true);
    setError('');
    
    try {
      console.log('Deleting user:', deleteModal.user._id);
      
      const response = await fetch(`/api/admin/users/${deleteModal.user._id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setSuccess(data.message || 'User deleted successfully');
        setDeleteModal({ isOpen: false, user: null });
        
        // Refresh user list
        await fetchUsers(pagination.currentPage, filters);
      } else {
        setError(data.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(`Delete failed: ${error.message}`);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Cancel delete
  const cancelDelete = useCallback(() => {
    if (!deleteLoading) {
      setDeleteModal({ isOpen: false, user: null });
    }
  }, [deleteLoading]);

  // Handle view user dashboard - MAIN FUNCTION FOR VIEWING USER DASHBOARD
  const handleViewUser = useCallback((user) => {
    console.log('handleViewUser called with user:', user);
    
    // Validate user data
    if (!user) {
      console.error('No user provided to handleViewUser');
      setError('Unable to view user: User data is missing');
      return;
    }

    if (!user._id) {
      console.error('User ID is missing:', user);
      setError('Unable to view user: User ID is missing');
      return;
    }

    // Validate user type
    if (!user.userType) {
      console.error('User type is missing:', user);
      setError('Unable to view user: User type is missing');
      return;
    }

    // Clear any existing errors
    setError('');
    
    // Update modal state
    setViewUserModal({
      isOpen: true,
      user: user
    });
    
    console.log('View user modal opened for:', user.name, user.userType);
  }, []);

  // Close view user modal
  const closeViewUserModal = useCallback(() => {
    console.log('Closing view user modal');
    setViewUserModal({ isOpen: false, user: null });
  }, []);

  // Get user dashboard links based on user type
  const getUserDashboardLinks = useCallback((userType, userId) => {
    const baseLinks = [
      { label: 'My Profile', href: `/profile/${userType}/${userId}`, icon: '👤' },
      
    ];
    
    let typeSpecificLinks = [];
    
    switch (userType) {
      case 'owner':
        typeSpecificLinks = [
          
          { label: 'My favorites', href: '/favoritepets', icon: '❤️' },
          { label: 'My Adoption Request', href: '/mesdemandeadoption', icon: '🤝' },
          { label: 'My animals', href: '/mesanimaux', icon: '🐾' },
          { label: 'Manage Adoption', href: '/adoptiondemande', icon: '🏠' },
        ];
        break;

      case 'vet':
        typeSpecificLinks = [
          { label: 'My Adoption Request', href: '/mesdemandeadoption', icon: '🤝' },
          { label: 'My animals', href: '/mesanimaux', icon: '🐾' },
          { label: 'My favorites', href: '/favoritepets', icon: '❤️' },
          { label: 'Manage Adoption', href: '/adoptiondemande', icon: '🏠' }
        ];
        break;
        
      case 'association':
        typeSpecificLinks = [
          { label: 'Abuse Reports', href: '/abuse-reports', icon: '🛡️' },
          { label: 'My Adoption Request', href: '/mesdemandeadoption', icon: '🤝' },
          { label: 'My animals', href: '/mesanimaux', icon: '🐾' },
          { label: 'My favorites', href: '/favoritepets', icon: '❤️' },
          { label: 'Manage Adoption', href: '/adoptiondemande', icon: '🏠' }
        ];
        break;
        
      case 'store':
        typeSpecificLinks = [
          { label: 'My products', href: '/my-products', icon: '🏪' },
          { label: 'My Adoption Request', href: '/mesdemandeadoption', icon: '🤝' },
          { label: 'My animals', href: '/mesanimaux', icon: '🐾' },
          { label: 'My favorites', href: '/favoritepets', icon: '❤️' },
          { label: 'Manage Adoption', href: '/adoptiondemande', icon: '🏠' }
        ];
        break;
        
      default:
        console.warn('Unknown user type:', userType);
        typeSpecificLinks = [];
    }
    
    return [...baseLinks, ...typeSpecificLinks];
  }, []);

  // Clear messages after timeout
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        {/* Page Header */}
        <div className={styles.header}>
          <div>
            <h1>User Management</h1>
            <p>Manage all registered users across the platform</p>
          </div>
          <div className={styles.headerStats}>
            <span className={styles.stat}>
              Total: {pagination.totalUsers} users
            </span>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className={styles.alert} data-type="error">
            <span className={styles.alertIcon}>⚠️</span>
            {error}
            <button 
              onClick={() => setError('')}
              className={styles.alertClose}
              type="button"
            >
              ✕
            </button>
          </div>
        )}

        {success && (
          <div className={styles.alert} data-type="success">
            <span className={styles.alertIcon}>✅</span>
            {success}
            <button 
              onClick={() => setSuccess('')}
              className={styles.alertClose}
              type="button"
            >
              ✕
            </button>
          </div>
        )}

        {/* Filters */}
        <UserFilters
          filters={filters}
          userTypes={userTypes}
          onFilterChange={handleFilterChange}
        />

        {/* Users Table */}
        <div className={styles.tableSection}>
          <UserTable
            users={users}
            loading={loading}
            onDelete={handleDeleteUser}
            onView={handleViewUser}
          />
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className={styles.pagination}>
            <button
              onClick={() => handlePageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage <= 1 || loading}
              className={styles.paginationButton}
              type="button"
            >
              ← Previous
            </button>
            
            <div className={styles.paginationInfo}>
              <span>
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <span>
                ({pagination.totalUsers} total users)
              </span>
            </div>
            
            <button
              onClick={() => handlePageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages || loading}
              className={styles.paginationButton}
              type="button"
            >
              Next →
            </button>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <DeleteModal
          isOpen={deleteModal.isOpen}
          user={deleteModal.user}
          loading={deleteLoading}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />

        {/* View User Dashboard Modal */}
        {viewUserModal.isOpen && viewUserModal.user && (
          <div className={styles.userModalOverlay} onClick={closeViewUserModal}>
            <div 
              className={styles.viewUserModal}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={styles.userModalHeader}>
                <h3>
                  {viewUserModal.user.name}'s Dashboard 
                  <span className={styles.userTypeLabel}>
                    ({getUserTypeLabel(viewUserModal.user.userType)})
                  </span>
                </h3>
                <button 
                  className={styles.closeButton}
                  onClick={closeViewUserModal}
                  aria-label="Close modal"
                  type="button"
                >
                  ✕
                </button>
              </div>
              
              <div className={styles.userModalContent}>
                <div className={styles.userInfo}>
                  <div className={styles.userAvatar}>
                    👤
                  </div>
                  <div className={styles.userDetails}>
                    <h4>{viewUserModal.user.name}</h4>
                    <p>{viewUserModal.user.email}</p>
                    {viewUserModal.user.phone && (
                      <p>📞 {viewUserModal.user.phone}</p>
                    )}
                    {viewUserModal.user.address && (
                      <p>📍 {viewUserModal.user.address}</p>
                    )}
                    <p className={styles.registrationDate}>
                      Registered: {formatDate(viewUserModal.user.createdAt)}
                    </p>
                  </div>
                </div>
                
                <div className={styles.dashboardLinks}>
                  <h4>User Dashboard Access</h4>
                  <p className={styles.accessNote}>
                    Click on any link below to access the user's dashboard as an admin
                  </p>
                  <div className={styles.linksGrid}>
                    {getUserDashboardLinks(viewUserModal.user.userType, viewUserModal.user._id).map((link, index) => (
                      <a
                        key={index}
                        href={`${link.href}?userId=${viewUserModal.user._id}&adminView=true`}
                        className={styles.dashboardLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => console.log('Opening dashboard link:', link.href)}
                      >
                        <span className={styles.linkIcon}>{link.icon}</span>
                        <span>{link.label}</span>
                        <span className={styles.externalIcon}>🔗</span>
                      </a>
                    ))}
                  </div>
                </div>
                
                <div className={styles.adminActions}>
                  <h4>Admin Actions</h4>
                  <div className={styles.actionButtons}>
                    <button
                      onClick={() => {
                        const profileUrl = `/profile/${viewUserModal.user.userType}/${viewUserModal.user._id}?adminView=true`;
                        console.log('Opening full profile:', profileUrl);
                        window.open(profileUrl, '_blank');
                      }}
                      className={styles.actionButton}
                      type="button"
                    >
                      🔍 View Full Profile
                    </button>
                    <button
                      onClick={() => {
                        closeViewUserModal();
                        handleDeleteUser(viewUserModal.user);
                      }}
                      className={`${styles.actionButton} ${styles.dangerButton}`}
                      type="button"
                    >
                      🗑️ Delete User
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}