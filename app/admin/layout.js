//admin layout.js - Version Corrigée
'use client';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { isAdminClient } from '../config/adminconfig-client'; // Import client uniquement

export default function AdminLayout({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session || !isAdminClient(session.user.email)) {
      router.push('/');
      return;
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#6c757d'
      }}>
        Loading...
      </div>
    );
  }

  if (!session || !isAdminClient(session.user.email)) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#dc3545'
      }}>
        Access Denied - Admin Only
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <nav style={{
        backgroundColor: '#2c3e50',
        padding: '80px 1rem 2rem',
        borderBottom: '3px solid #34495e'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <div>
            <h1 style={{ 
              color: 'white', 
              margin: 0, 
              fontSize: '24px',
              fontWeight: '600'
            }}>
              Admin Dashboard
            </h1>
            <p style={{ 
              color: '#bdc3c7', 
              margin: '5px 0 0 0', 
              fontSize: '14px' 
            }}>
              Welcome back, {session.user.name}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <Link 
              href="/admin" 
              style={{ 
                color: '#ecf0f1', 
                textDecoration: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#34495e'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              Dashboard
            </Link>
            <Link 
              href="/admin/users" 
              style={{ 
                color: '#ecf0f1', 
                textDecoration: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#34495e'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
            >
              User Management
            </Link>
            <Link 
              href="/" 
              style={{ 
                color: '#e74c3c', 
                textDecoration: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                border: '1px solid #e74c3c',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#e74c3c';
                e.target.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#e74c3c';
              }}
            >
              Back to Site
            </Link>
          </div>
        </div>
      </nav>
      <main>
        {children}
      </main>
    </div>
  );
}