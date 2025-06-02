'use client';
import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Heart, 
  Stethoscope, 
  Building2, 
  Store,
  RefreshCw,
  BarChart3,
  Settings,
  Database,
  Calendar,
  Shield,
  ArrowRight
} from 'lucide-react';
import styles from './dashboard.module.css';

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    totalUsers: 0,
    owners: 0,
    vets: 0,
    associations: 0,
    stores: 0,
    loading: true
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true }));

      // Fetch stats for each user type separately to get accurate counts
      const [allUsers, owners, vets, associations, stores] = await Promise.all([
        fetch('/api/admin/users?page=1&userType=all&limit=1').then(res => res.json()),
        fetch('/api/admin/users?page=1&userType=owner&limit=1').then(res => res.json()),
        fetch('/api/admin/users?page=1&userType=vet&limit=1').then(res => res.json()),
        fetch('/api/admin/users?page=1&userType=association&limit=1').then(res => res.json()),
        fetch('/api/admin/users?page=1&userType=store&limit=1').then(res => res.json())
      ]);

      // Use totalUsers from each response instead of counting manually
      setStats({
        totalUsers: allUsers.totalUsers || 0,
        owners: owners.totalUsers || 0,
        vets: vets.totalUsers || 0,
        associations: associations.totalUsers || 0,
        stores: stores.totalUsers || 0,
        loading: false
      });

      console.log('Dashboard stats loaded:', {
        total: allUsers.totalUsers,
        owners: owners.totalUsers,
        vets: vets.totalUsers,
        associations: associations.totalUsers,
        stores: stores.totalUsers
      });

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'primary',
      link: '/admin/users'
    },
    {
      title: 'Pet Owners',
      value: stats.owners,
      icon: Heart,
      color: 'success',
      link: '/admin/users?userType=owner'
    },
    {
      title: 'Veterinarians',
      value: stats.vets,
      icon: Stethoscope,
      color: 'info',
      link: '/admin/users?userType=vet'
    },
    {
      title: 'Associations',
      value: stats.associations,
      icon: Building2,
      color: 'warning',
      link: '/admin/users?userType=association'
    },
    {
      title: 'Pet Stores',
      value: stats.stores,
      icon: Store,
      color: 'secondary',
      link: '/admin/users?userType=store'
    }
  ];

  return (
    <div className={styles.dashboard}>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1>Admin Dashboard</h1>
            <p>Tableau de bord de gestion système</p>
          </div>
          <div className={styles.headerActions}>
            <button 
              onClick={fetchDashboardStats}
              className={styles.refreshButton}
              disabled={stats.loading}
            >
              <RefreshCw size={18} className={stats.loading ? 'animate-spin' : ''} />
              {stats.loading ? 'Actualisation...' : 'Actualiser'}
            </button>
          </div>
        </div>

        <div className={styles.statsGrid}>
          {statCards.map((card, index) => {
            const IconComponent = card.icon;
            return (
              <Link 
                key={index} 
                href={card.link}
                className={`${styles.statCard} ${styles[card.color]}`}
              >
                <div className={styles.statIcon}>
                  <IconComponent size={24} />
                </div>
                <div className={styles.statInfo}>
                  <h3>{stats.loading ? '...' : card.value}</h3>
                  <p>{card.title}</p>
                </div>
                <div className={styles.statArrow}>
                  <ArrowRight size={20} />
                </div>
              </Link>
            );
          })}
        </div>

        <div className={styles.quickActions}>
          <h2>Quick Actions</h2>
          <div className={styles.actionsGrid}>
            <Link href="/admin/users" className={styles.actionCard}>
              <div className={styles.actionIcon}>
                <Users size={24} />
              </div>
              <div className={styles.actionInfo}>
                <h3>Manage Users</h3>
                <p>View, search and manage all registered users</p>
              </div>
            </Link>

            <div className={styles.actionCard}>
              <div className={styles.actionIcon}>
                <BarChart3 size={24} />
              </div>
              <div className={styles.actionInfo}>
                <h3>Analytics</h3>
                <p>Coming Soon - View detailed statistics and reports</p>
              </div>
            </div>

            <div className={styles.actionCard}>
              <div className={styles.actionIcon}>
                <Settings size={24} />
              </div>
              <div className={styles.actionInfo}>
                <h3>Settings</h3>
                <p>Coming Soon - Configure system settings</p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.recentActivity}>
          <h2>System Information</h2>
          <div className={styles.infoCards}>
            <div className={styles.infoCard}>
              <h4>
                <Database size={18} />
                Database Status
              </h4>
              <p className={styles.statusGood}>Connected</p>
            </div>
            <div className={styles.infoCard}>
              <h4>
                <Calendar size={18} />
                Last Update
              </h4>
              <p>{new Date().toLocaleDateString()}</p>
            </div>
            <div className={styles.infoCard}>
              <h4>
                <Shield size={18} />
                Admin Level
              </h4>
              <p>Super Administrator</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}