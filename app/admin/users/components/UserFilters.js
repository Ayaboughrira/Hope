'use client';
import { useState } from 'react';
import styles from '../page.module.css';

export default function UserFilters({ filters, userTypes, onFilterChange }) {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleInputChange = (field, value) => {
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);
    
    // Apply filter immediately for selects, but wait for search form submission
    if (field !== 'search') {
      onFilterChange(newFilters);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onFilterChange(localFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      search: '',
      userType: 'all',
      sortBy: 'newest'
    };
    setLocalFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  return (
    <div className={styles.filters}>
      <div className={styles.filtersHeader}>
        <h3>Filter Users</h3>
        <button 
          type="button" 
          onClick={handleClearFilters}
          className={styles.clearButton}
        >
          Clear All
        </button>
      </div>

      <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
        <input
          type="text"
          placeholder="Search by name or email..."
          value={localFilters.search}
          onChange={(e) => handleInputChange('search', e.target.value)}
          className={styles.searchInput}
        />
        <button type="submit" className={styles.searchButton}>
          Search
        </button>
      </form>

      <div className={styles.filterRow}>
        <div className={styles.filterGroup}>
          <label htmlFor="userType">User Type:</label>
          <select
            id="userType"
            value={localFilters.userType}
            onChange={(e) => handleInputChange('userType', e.target.value)}
            className={styles.select}
          >
            <option value="all">All Types</option>
            {userTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="sortBy">Sort By:</label>
          <select
            id="sortBy"
            value={localFilters.sortBy}
            onChange={(e) => handleInputChange('sortBy', e.target.value)}
            className={styles.select}
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
          </select>
        </div>
      </div>
    </div>
  );
}