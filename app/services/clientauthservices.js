// services/clientAuthServices.js
import { signIn } from 'next-auth/react';

/**
 * Service d'inscription des utilisateurs
 * @param {string} userType - Type d'utilisateur (owner, vet, association, store)
 * @param {object} userData - Données utilisateur
 * @returns {Promise<object>} - Résultat de l'inscription
 */
export async function signup(userType, userData) {
  try {
    // Envoi des données au backend
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userType,
        ...userData
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Échec de l\'inscription'
      };
    }

    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    return {
      success: false,
      error: 'Une erreur est survenue lors de l\'inscription'
    };
  }
}

/**
 * Service de connexion des utilisateurs (utilise Next-Auth)
 * @param {string} email - Email de l'utilisateur
 * @param {string} password - Mot de passe de l'utilisateur
 * @returns {Promise<object>} - Résultat de la connexion
 */
export async function login(email, password) {
  try {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false
    });

    return {
      success: !result.error,
      error: result.error
    };
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    return {
      success: false,
      error: 'Une erreur est survenue lors de la connexion'
    };
  }
}