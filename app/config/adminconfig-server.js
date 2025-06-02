// config/adminconfig-server.js
// Version SERVEUR UNIQUEMENT - Avec imports serveur

import { getServerSession } from 'next-auth/next';
import { authOptions } from '../api/auth/[...nextauth]/route';

// Admin emails list (même liste que côté client)
export const ADMIN_EMAILS = [
  'helpingourpetseveryday@gmail.com',
   'hope65622@gmail.com', // Your main admin email
  // Add more admin emails here if needed
];

// Server-side admin check
export const isAdmin = (email) => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};

// Server-side admin requirement
export const requireAdmin = async () => {
  const session = await getServerSession(authOptions);
  
  if (!session || !isAdmin(session.user.email)) {
    throw new Error('Access denied - Admin required');
  }
  
  return session;
};
