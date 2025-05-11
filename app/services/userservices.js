import { getSession } from 'next-auth/react';

/**
 * Récupère les données d'un utilisateur en fonction de son type et de son ID
 * @param {string} userType - Type d'utilisateur (owner, vet, association, store)
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<object>} Les données utilisateur ou une erreur
 */
export async function getUserData(userType, userId) {
  try {
    // Récupérer la session actuelle pour obtenir le token d'authentification si disponible
    const session = await getSession();
    
    // Préparer les options de la requête
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    // Ajouter le token d'authentification si disponible
    if (session?.accessToken) {
      options.headers.Authorization = `Bearer ${session.accessToken}`;
    }
    
    // Envoyer la requête à l'API
    const response = await fetch(`/api/users/${userType}/${userId}`, options);
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        message: data.message || `Impossible de récupérer les données de l'utilisateur`
      };
    }
    
    return {
      success: true,
      user: data.user,
      isPublicView: data.isPublicView
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des données utilisateur:', error);
    return {
      success: false,
      message: 'Une erreur inattendue s\'est produite'
    };
  }
}

/**
 * Met à jour les données d'un utilisateur
 * @param {string} userType - Type d'utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {object} userData - Nouvelles données utilisateur
 * @returns {Promise<object>} Résultat de la mise à jour
 */
export async function updateUserData(userType, userId, userData) {
  try {
    const session = await getSession();
    
    // Vérifier si l'utilisateur est authentifié
    if (!session) {
      return {
        success: false,
        message: "Vous devez être connecté pour effectuer cette action"
      };
    }
    
    const options = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    };
    
    if (session.accessToken) {
      options.headers.Authorization = `Bearer ${session.accessToken}`;
    }
    
    const response = await fetch(`/api/users/${userType}/${userId}`, options);
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        message: data.message || "Échec de la mise à jour du profil"
      };
    }
    
    return {
      success: true,
      user: data.user,
      message: data.message
    };
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    return {
      success: false,
      message: 'Une erreur inattendue s\'est produite'
    };
  }
}

/**
 * Récupère la liste des utilisateurs par type
 * @param {string} userType - Type d'utilisateur (owner, vet, association, store)
 * @param {object} options - Options de pagination et de recherche
 * @returns {Promise<object>} Liste des utilisateurs ou erreur
 */
export async function getUsersByType(userType, options = {}) {
  try {
    const { search = '', page = 1, limit = 10 } = options;
    const session = await getSession();
    
    // Construire l'URL avec les paramètres de requête
    let url = `/api/users/${userType}?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    
    // Préparer les options de la requête
    const requestOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    // Ajouter le token d'authentification si disponible
    if (session?.accessToken) {
      requestOptions.headers.Authorization = `Bearer ${session.accessToken}`;
    }
    
    // Envoyer la requête à l'API
    const response = await fetch(url, requestOptions);
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        message: data.message || `Impossible de récupérer la liste des utilisateurs`
      };
    }
    
    return {
      success: true,
      users: data.users,
      pagination: data.pagination
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des utilisateurs:', error);
    return {
      success: false,
      message: 'Une erreur inattendue s\'est produite'
    };
  }
}