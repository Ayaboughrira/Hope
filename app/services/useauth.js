// hooks/useAuth.js
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Mêmes collections que dans votre authService
const COLLECTIONS = {
  owner: 'user',
  vet: 'veterinaire',
  association: 'association',
  store: 'animalrie'
};

export function useAuth() {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      
      if (firebaseUser) {
        // L'utilisateur est connecté, récupérons ses informations
        try {
          // Essayer chaque collection pour trouver l'utilisateur
          let userData = null;
          let foundType = null;
          
          for (const [type, collection] of Object.entries(COLLECTIONS)) {
            const userDoc = await getDoc(doc(db, collection, firebaseUser.uid));
            if (userDoc.exists()) {
              userData = userDoc.data();
              foundType = type;
              break;
            }
          }
          
          if (userData) {
            setUser({
              ...firebaseUser,
              ...userData
            });
            setUserType(foundType);
          } else {
            setUser(firebaseUser);
            setUserType(null);
          }
        } catch (error) {
          console.error("Erreur lors de la récupération des données utilisateur:", error);
          setUser(firebaseUser);
          setUserType(null);
        }
      } else {
        // L'utilisateur n'est pas connecté
        setUser(null);
        setUserType(null);
      }
      
      setLoading(false);
    });

    // Nettoyage de l'abonnement lors du démontage du composant
    return () => unsubscribe();
  }, []);

  return {
    user,
    userType,
    isAuthenticated: !!user,
    loading
  };
}