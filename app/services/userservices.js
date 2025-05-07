// services/userServices.js

/**
 * Récupère les données d'un utilisateur à partir de l'API
 * @param {string} userType - Le type d'utilisateur (owner, vet, association, store)
 * @param {string} id - L'ID de l'utilisateur
 * @returns {Promise<Object>} Les données utilisateur
 */
export const getUserData = async (userType, id) => {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
    };

    // Ajouter le token d'authentification s'il existe
    if (token) {
      headers['Authorization'] =' Bearer ${token}';
    }

    const response = await fetch('/api/users/${userType}/${id}', {
      method: 'GET',
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erreur lors de la récupération des données utilisateur:', response.status);
      return { 
        success: false, 
        message: data.message ||' Erreur serveur: ${response.status} '
      };
    }

    return data;
  } catch (error) {
    console.error('Erreur lors de la récupération des données utilisateur:', error);
    return { 
      success: false, 
      message: 'Impossible de récupérer les données utilisateur' 
    };
  }
};

/**
 * Met à jour les données d'un utilisateur
 * @param {string} userType - Le type d'utilisateur (owner, vet, association, store)
 * @param {string} id - L'ID de l'utilisateur
 * @param {Object} userData - Les données utilisateur mises à jour
 * @returns {Promise<Object>} La réponse de mise à jour
 */
export const updateUserData = async (userType, id, userData) => {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
    };

    // Ajouter le token d'authentification s'il existe
    if (token) {
      headers['Authorization'] = 'Bearer ${token}';
    }

    const response = await fetch('/api/users/${userType}/${id}', {
      method: 'PUT',
      headers,
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Erreur lors de la mise à jour des données utilisateur:', response.status);
      return { 
        success: false, 
        message: data.message || 'Erreur serveur: ${response.status} '
      };
    }

    return data;
  } catch (error) {
    console.error('Erreur lors de la mise à jour des données utilisateur:', error);
    return { 
      success: false, 
      message: 'Impossible de mettre à jour les données utilisateur' 
    };
  } 
};