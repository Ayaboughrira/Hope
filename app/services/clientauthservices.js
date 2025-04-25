// services/clientauthservices.js

export async function signup(userType, userData) {
    try {
      console.log('Envoi de la requête d\'inscription:', userType, userData.email);
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userType, ...userData }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Erreur de réponse serveur:', response.status, data);
        return { 
          success: false, 
          error: data.error || `Erreur du serveur: ${response.status}`
        };
      }
  
      return data;
    } catch (error) {
      console.error('Échec de la requête d\'inscription:', error);
      return { 
        success: false, 
        error: 'Impossible de se connecter au serveur. Vérifiez votre connexion internet ou réessayez plus tard.'
      };
    }
  }
  
  export async function login(email, password) {
    try {
      console.log('Envoi de la requête de connexion pour:', email);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Erreur de réponse serveur:', response.status, data);
        return { 
          success: false, 
          error: data.error || `Erreur du serveur: ${response.status}`
        };
      }
  
      return data;
    } catch (error) {
      console.error('Échec de la requête de connexion:', error);
      return { 
        success: false, 
        error: 'Impossible de se connecter au serveur. Vérifiez votre connexion internet ou réessayez plus tard.'
      };
    }
  }