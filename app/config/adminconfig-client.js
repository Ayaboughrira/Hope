// config/adminconfig-client.js
// Version CLIENT UNIQUEMENT - Pas d'imports serveur

// Admin emails list
export const ADMIN_EMAILS = [
  'helpingourpetseveryday@gmail.com',
  'hope65622@gmail.com', // Your main admin email
  // Add more admin emails here if needed
];

// Client-side admin check (pour les composants client)
export const isAdminClient = (email) => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
};