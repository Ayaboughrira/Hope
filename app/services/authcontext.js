/*'use client'

import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as loginService, signup as signupService, logout as logoutService, getCurrentUser } from './clientauthservices';
import { getUserData } from './userservices';

// Création du contexte
const AuthContext = createContext();

// Hook personnalisé pour utiliser le contexte
export const useAuth = () => useContext(AuthContext);

// Fournisseur du contexte
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Vérifier si l'utilisateur est connecté au chargement
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const currentUser = getCurrentUser();

        if (!currentUser) {
          setLoading(false);
          return;
        }

        // Récupérer les données utilisateur complètes
        const { userId, userType } = currentUser;
        const userData = await getUserData(userType, userId);

        if (userData.success) {
          setUser({
            ...userData.user,
            userType
          });
        }
      } catch (error) {
        console.error('Erreur de vérification d\'authentification:', error);
        logoutService();
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Fonction de connexion
  const login = async (email, password) => {
    const result = await loginService(email, password);

    if (result.success) {
      const currentUser = getCurrentUser();
      if (currentUser) {
        const userData = await getUserData(currentUser.userType, currentUser.userId);
        if (userData.success) {
          setUser({
            ...userData.user,
            userType: currentUser.userType
          });
        }
      }
    }

    return result;
  };

  // Fonction d'inscription
  const signup = async (userData, userType) => {
    const result = await signupService(userType, userData);

    if (result.success) {
      // Connexion automatique après inscription
      return await login(userData.email, userData.password);
    }

    return result;
  };

  // Fonction de déconnexion
  const logout = () => {
    logoutService();
    setUser(null);
  };

  // Valeur du contexte
  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
*/